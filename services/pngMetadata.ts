
import { TavernCardData, CharacterMetadata } from '../types';

/**
 * 辅助函数：解压缩数据
 */
async function decompress(data: Uint8Array): Promise<Uint8Array> {
  try {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(data);
    writer.close();
    const response = new Response(ds.readable);
    return new Uint8Array(await response.arrayBuffer());
  } catch (err) {
    throw new Error("DECOMPRESS_FAILED");
  }
}

/**
 * 验证解析出的对象是否符合酒馆角色卡特征
 */
function isValidTavernObject(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  // V2 格式特征
  if (obj.data && typeof obj.data.name === 'string') return true;
  // V1 格式特征
  if (typeof obj.name === 'string' && (typeof obj.description === 'string' || typeof obj.personality === 'string')) return true;
  return false;
}

/**
 * 尝试解析 JSON 或 Base64 编码的 JSON
 */
function tryParseFlexible(str: string): CharacterMetadata | null {
  const cleanStr = str.trim();
  if (!cleanStr) return null;

  const extract = (obj: any): CharacterMetadata => {
    const charData = obj.data || obj;
    return {
      name: charData.name || 'Unknown',
      description: charData.description || '',
      personality: charData.personality || '',
      scenario: charData.scenario || '',
      first_mes: charData.first_mes || '',
      mes_example: charData.mes_example || '',
      creator_notes: charData.creator_notes,
      system_prompt: charData.system_prompt,
      tags: charData.tags
    };
  };

  // 1. 直接解析 JSON
  if (cleanStr.startsWith('{')) {
    try {
      const parsed = JSON.parse(cleanStr);
      if (isValidTavernObject(parsed)) return extract(parsed);
    } catch (e) {}
  }

  // 2. 尝试 Base64 解码后解析
  try {
    // 过滤掉非 Base64 字符
    const b64Candidate = cleanStr.replace(/[^A-Za-z0-9+/=]/g, "");
    if (b64Candidate.length > 20) {
      const decoded = atob(b64Candidate);
      if (decoded.trim().startsWith('{')) {
        const parsed = JSON.parse(decoded);
        if (isValidTavernObject(parsed)) return extract(parsed);
      }
    }
  } catch (e) {}

  return null;
}

/**
 * 深度全文件暴力搜索 JSON 结构
 */
function performBruteForceScan(uint8: Uint8Array): CharacterMetadata | null {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  // 我们不需要解码整个文件，只需搜索可能的部分
  // 重点寻找 '{' 字符
  const startPoints: number[] = [];
  for (let i = 0; i < uint8.length; i++) {
    if (uint8[i] === 123) { // '{' 的 ASCII 码
      startPoints.push(i);
    }
  }

  // 从后往前搜通常更快，因为酒馆元数据往往在文件后部
  for (let i = startPoints.length - 1; i >= 0; i--) {
    const start = startPoints[i];
    // 限制搜索长度，通常角色卡 JSON 不会超过 500KB
    const end = Math.min(start + 512000, uint8.length);
    const chunk = uint8.slice(start, end);
    const text = decoder.decode(chunk);
    
    // 寻找最近的闭合括号
    let lastBrace = text.lastIndexOf('}');
    while (lastBrace !== -1 && lastBrace > 0) {
      const potentialJson = text.substring(0, lastBrace + 1);
      const result = tryParseFlexible(potentialJson);
      if (result) return result;
      lastBrace = text.lastIndexOf('}', lastBrace - 1);
      // 性能保护：如果已经尝试了很多次还没成功，跳过这个起点
      if (text.length - lastBrace > 10000) break;
    }
  }
  return null;
}

/**
 * 主提取函数
 */
export async function extractTavernData(file: File): Promise<CharacterMetadata | null> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  const view = new DataView(buffer);
  
  if (view.getUint32(0) !== 0x89504E47) {
    throw new Error('该文件不是 PNG 格式。请确保上传的是原始 PNG 图片。');
  }

  // 1. 标准块解析 (tEXt, iTXt, zTXt)
  let offset = 8;
  while (offset < view.byteLength) {
    if (offset + 12 > view.byteLength) break;
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...uint8.slice(offset + 4, offset + 8));

    if (['tEXt', 'iTXt', 'zTXt'].includes(type) && length > 0) {
      const data = uint8.slice(offset + 8, offset + 8 + length);
      const nullIndex = data.indexOf(0);
      if (nullIndex !== -1) {
        const keyword = new TextDecoder().decode(data.slice(0, nullIndex)).toLowerCase();
        // 兼容不同的关键词
        if (keyword === 'chara' || keyword === 'character') {
          try {
            let jsonStr = '';
            if (type === 'tEXt') {
              jsonStr = new TextDecoder().decode(data.slice(nullIndex + 1));
            } else if (type === 'zTXt') {
              jsonStr = new TextDecoder().decode(await decompress(data.slice(nullIndex + 2)));
            } else if (type === 'iTXt') {
              const comp = data[nullIndex + 1];
              let pos = nullIndex + 3;
              while (pos < data.length && data[pos] !== 0) pos++; pos++; // lang
              while (pos < data.length && data[pos] !== 0) pos++; pos++; // trans
              const textData = data.slice(pos);
              jsonStr = new TextDecoder().decode(comp === 1 ? await decompress(textData) : textData);
            }
            const result = tryParseFlexible(jsonStr);
            if (result) return result;
          } catch (e) {}
        }
      }
    }
    offset += length + 12;
    if (type === 'IEND') break;
  }

  // 2. 如果标准解析失败，执行更激进的暴力搜索
  return performBruteForceScan(uint8);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'character';
}
