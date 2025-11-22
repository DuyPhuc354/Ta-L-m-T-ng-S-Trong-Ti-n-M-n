
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Disciple } from "../types";

const API_KEY = process.env.API_KEY;

// Schemas
const traitSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    isPositive: { type: Type.BOOLEAN },
    description: { type: Type.STRING },
    tier: { type: Type.STRING, enum: ['S', 'A', 'B', 'C', 'F'] }
  },
  required: ['name', 'isPositive', 'tier']
};

const skillSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    level: { type: Type.NUMBER }
  },
  required: ['name', 'level']
};

const statsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    potential: { type: Type.NUMBER },
    aptitude: { type: Type.NUMBER },
    bone: { type: Type.NUMBER },
    intelligence: { type: Type.NUMBER },
    charm: { type: Type.NUMBER },
    luck: { type: Type.NUMBER }
  },
  required: ['potential', 'aptitude', 'bone', 'intelligence', 'charm', 'luck']
};

const discipleResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    originClass: { type: Type.STRING },
    stats: statsSchema,
    traits: { type: Type.ARRAY, items: traitSchema },
    skills: { type: Type.ARRAY, items: skillSchema },
    primaryElement: { type: Type.STRING, enum: ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Tạp'] },
    verdict: { type: Type.STRING, enum: ['RECRUIT', 'KEEP_WORKER', 'EXPEL_CANDIDATE', 'REJECT'] },
    role: { 
      type: Type.STRING, 
      enum: [
        'DPS', 'TANK', 'HEALER', 'CROWD_CONTROL', 'EXPLORER_CAPTAIN',
        'MASTER_CRAFTSMAN', 'FODDER', 'SPECIAL_CASE'
      ] 
    },
    analysis: { type: Type.STRING, description: "Một câu lý do cực ngắn gọn và súc tích (dưới 20 từ)." },
    score: { type: Type.NUMBER }
  },
  required: ['name', 'originClass', 'stats', 'traits', 'primaryElement', 'verdict', 'role', 'analysis', 'score']
};

export const DEFAULT_SYSTEM_INSTRUCTION = `
Bạn là Hộ Pháp Tông Môn. Nhiệm vụ: Trích xuất dữ liệu từ ảnh và Đưa ra phán quyết ngắn gọn.

**INPUT QUAN TRỌNG:** Đọc chính xác 6 chỉ số (Tiềm Lực, Tư Chất, Căn Cốt, Thông Tuệ, Mị Lực, Cơ Duyên), Tên, Hệ (Kim/Mộc/Thủy/Hỏa/Thổ/Tạp).

**OUTPUT:**
- verdict: 
  + RECRUIT (Chiêu Mộ): Chỉ số ngon, trait xịn, hoặc cần thiết cho team.
  + KEEP_WORKER (Nô Lệ): Chỉ số chiến đấu thấp nhưng có nghề (Luyện Đan/Khí/Trận > 5) hoặc trait 'Kỳ Tài'.
  + EXPEL_CANDIDATE (Có Thể Trục Xuất): Không quá phế nhưng không nổi bật (Tiềm lực 60-70, không có trait ngon, hệ Tạp). Giữ nếu còn chỗ, đuổi nếu full.
  + REJECT (Trục Xuất): Phế vật (Tiềm lực < 60), Trait xấu, Hệ tạp, không có nghề.
- analysis: **BẮT BUỘC CHỈ VIẾT 1 CÂU NGẮN GỌN GIẢI THÍCH LÝ DO.** (Ví dụ: "Tiềm lực quá thấp, không thể tu luyện.", "Thợ rèn bậc thầy, cần giữ.", "Tanker tiềm năng với Căn Cốt cao.", "Chỉ số trung bình, giữ nếu thiếu người.")

**LOGIC ĐÁNH GIÁ MẶC ĐỊNH:**
1. **Ưu tiên:** Trait "Thiên Mệnh Chi Nhân" hoặc Kỹ năng > 15 => RECRUIT (Đặc biệt).
2. **Kinh tế:** Trait "Kỳ Tài..." hoặc Nghề > 7 => KEEP_WORKER.
3. **Chiến đấu:** 
   - Tank: Căn Cốt > 80 + Tiềm Lực > 70 => RECRUIT.
   - DPS: Tư Chất > 80 + Tiềm Lực > 70 => RECRUIT.
   - Healer: Tư Chất > 75 + Class Y Sư => RECRUIT.
4. **Ngoại lệ:** Khí Cảm (Tư Chất) >= 70 => Có thể xem xét RECRUIT.
5. **Rác:** Tiềm Lực < 60 và không có nghề => REJECT.
`;

export const analyzeDiscipleImage = async (base64Image: string, customInstruction?: string): Promise<Disciple> => {
  if (!API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Use custom instruction if provided, otherwise default
  const instruction = customInstruction && customInstruction.trim().length > 0 
    ? customInstruction 
    : DEFAULT_SYSTEM_INSTRUCTION;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "Phân tích ảnh đệ tử theo format JSON."
          }
        ]
      },
      config: {
        systemInstruction: instruction,
        responseMimeType: "application/json",
        responseSchema: discipleResponseSchema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    const cleanedJsonText = jsonText.replace(/```json\n|\n```/g, '').trim();
    const parsed = JSON.parse(cleanedJsonText);
    
    return {
      ...parsed,
      id: crypto.randomUUID()
    } as Disciple;

  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};
