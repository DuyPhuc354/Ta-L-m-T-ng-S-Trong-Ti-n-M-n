import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Disciple, Role, ElementType } from "../types";

const API_KEY = process.env.API_KEY;

// Define the JSON Schema for the response
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
    name: { type: Type.STRING }, // e.g., Luyện Đan, Luyện Khí, Kiếm Tu
    level: { type: Type.NUMBER }
  },
  required: ['name', 'level']
};

const statsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    potential: { type: Type.NUMBER, description: "Tiềm Lực" },
    aptitude: { type: Type.NUMBER, description: "Tư Chất (Attack, Cultivation Speed)" },
    bone: { type: Type.NUMBER, description: "Căn Cốt (HP, Defense)" },
    intelligence: { type: Type.NUMBER, description: "Thông Tuệ (Skill Learning, CC Resist)" },
    charm: { type: Type.NUMBER, description: "Mị Lực (Diplomacy)" },
    luck: { type: Type.NUMBER, description: "Cơ Duyên (Drop Rate, Event Chance)" }
  },
  required: ['potential', 'aptitude', 'bone', 'intelligence', 'charm', 'luck']
};

const discipleResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    originClass: { type: Type.STRING, description: "Xuất thân của đệ tử (e.g., Kiếm Tu, Binh Gia, Y Sư)" },
    stats: statsSchema,
    traits: { type: Type.ARRAY, items: traitSchema },
    skills: { type: Type.ARRAY, items: skillSchema },
    primaryElement: { type: Type.STRING, enum: ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Tạp'] },
    verdict: { type: Type.STRING, enum: ['RECRUIT', 'KEEP_WORKER', 'REJECT'] },
    role: { 
      type: Type.STRING, 
      enum: [
        'DPS', 'TANK', 'HEALER', 'CROWD_CONTROL', 'EXPLORER_CAPTAIN',
        'MASTER_CRAFTSMAN', 'FODDER', 'SPECIAL_CASE'
      ] 
    },
    analysis: { type: Type.STRING, description: "Reasoning based on the detailed algorithm and guiding principles." },
    score: { type: Type.NUMBER, description: "Calculated value 0-100 representing overall worth." }
  },
  required: ['name', 'originClass', 'stats', 'traits', 'primaryElement', 'verdict', 'role', 'analysis', 'score']
};

const SYSTEM_INSTRUCTION = `
Bạn là một chuyên gia thẩm định đệ tử trong game "Ta Làm Tông Sư Trong Tiên Môn" (bản Việt hóa).
Nhiệm vụ:
1. TRÍCH XUẤT CỰC KỲ CHÍNH XÁC: Đọc tất cả 6 chỉ số từ biểu đồ radar (Tư Chất, Căn Cốt, Thông Tuệ, Tiềm Lực, Mị Lực, Cơ Duyên), tên đệ tử, XUẤT THÂN, các đặc chất (trait) và kỹ năng nghề (skill) từ ảnh. Sai một số có thể làm hỏng toàn bộ phân tích.
2. ĐÁNH GIÁ CHUYÊN SÂU: Áp dụng THUẬT TOÁN ĐÁNH GIÁ 3 BƯỚC sau đây, có kết hợp NGUYÊN TẮC CHỈ ĐẠO để đưa ra phán quyết, vai trò và phân tích chi tiết.

**ĐỊNH NGHĨA 6 CHỈ SỐ CHO AI (Quan trọng nhất):**
- Tiềm Lực (Potential): CHỈ SỐ VUA. Quyết định giới hạn cấp độ (Level Cap).
    - Dưới 60: Phế (Không lên được map cao).
    - Trên 90: Thần (Endgame).
- Căn Cốt (Bone/Constitution): Quyết định Máu (HP) và Thủ (Def). Dành cho Tanker.
- Tư Chất (Aptitude): Quyết định Tấn công (Atk) và Tốc độ tu luyện. Dành cho DPS & Healer.
- Cơ Duyên (Luck): Quyết định Tỷ lệ rớt đồ/Sự kiện map. Dành cho Trưởng đoàn thám hiểm.
- Thông Tuệ (Wisdom): Ảnh hưởng tốc độ học kỹ năng nghề/kháng hiệu ứng. Dành cho Thợ.
- Mị Lực (Charisma): Dùng để ngoại giao/thu phục NPC. Hầu như vô dụng với đệ tử chiến đấu (Chỉ cần Main/Chưởng môn cao là đủ).

**NGUYÊN TẮC CHỈ ĐẠO (Ưu tiên thực tế):**
- Đưa ra lời khuyên thực tế. Nếu một đệ tử không đạt chuẩn lý tưởng nhưng là người tốt nhất cho một vai trò nào đó trong tông môn hiện tại, hãy ghi nhận điều đó trong 'analysis'.
- Ưu tiên Tiềm Lực: Giữa 2 đệ tử cùng vai trò, nếu một con Tư Chất 90 - Tiềm Lực 50 và con khác Tư Chất 80 - Tiềm Lực 80, hãy chọn con 80/80 vì con 90/50 sẽ bị kẹt cấp sớm.

**THUẬT TOÁN ĐÁNH GIÁ (BẮT BUỘC THỰC HIỆN THEO THỨ TỰ 1 -> 4):**

BƯỚC 1: QUÉT KỸ NGHỆ & NGOẠI LỆ (Ưu tiên Kinh tế F2P & Đặc biệt)
- IF (Tên == "Trư Bát Giới")
  => VERDICT: "RECRUIT"
  => ROLE: "SPECIAL_CASE"
  => ANALYSIS: "NGOẠI LỆ: Trư Bát Giới là nhân vật sự kiện/đặc biệt. GIỮ TUYỆT ĐỐI."
- IF (Bất kỳ Kỹ năng nào Level >= 15) HOẶC (Trait "Thiên Mệnh Chi Nhân")
  => VERDICT: "RECRUIT"
  => ROLE: "SPECIAL_CASE"
  => ANALYSIS: "NGOẠI LỆ: Kỹ năng > 15 hoặc có Trait 'Thiên Mệnh Chi Nhân'. GIỮ TUYỆT ĐỐI."
- IF (Trait chứa từ 'Kỳ Tài' - VD: 'Kỳ Tài Luyện Đan', 'Kỳ Tài Luyện Khí')
  - IF (Tiềm Lực < 50 AND Tư Chất < 50)
    => VERDICT: "KEEP_WORKER"
    => ROLE: "MASTER_CRAFTSMAN"
    => ANALYSIS: "NGOẠI LỆ: Có đặc chất 'Kỳ Tài' hiếm. Dù chỉ số rất thấp, vẫn nên cân nhắc giữ lại làm thợ chuyên nghiệp. Có thể trục xuất nếu thiếu chỗ."
    => SCORE: ~45
  - ELSE
    => VERDICT: "RECRUIT"
    => ROLE: "MASTER_CRAFTSMAN"
    => ANALYSIS: "NGOẠI LỆ: Có đặc chất 'Kỳ Tài' hiếm, là thợ nòng cốt không thể thiếu cho tông môn. Nên chiêu mộ."
    => SCORE: ~75
- IF (Luyện Đan >= 7 HOẶC Luyện Khí >= 7 HOẶC Trận Pháp >= 7)
  => VERDICT: "KEEP_WORKER"
  => ROLE: "MASTER_CRAFTSMAN"
  => ANALYSIS: "Nòng cốt kinh tế: Có nghề chính >= 7."

BƯỚC 2: QUÉT CHIẾN ĐẤU (Dựa trên Xuất thân + Chỉ số)
- **Nhóm TANK (Chịu đòn)**
  - Xuất thân: Binh Gia, Thiền Tu, Mật Tu.
  - Logic AI:
    - IF (Căn Cốt >= 80) AND (Tiềm Lực >= 60)
      => VERDICT: "RECRUIT"
      => ROLE: "TANK"
      => ANALYSIS: "Tanker chủ lực: Căn Cốt cao, Tiềm Lực đủ để phát triển."
    - IF (Căn Cốt < 60) AND (Xuất thân là Tanker)
      => VERDICT: "REJECT"
      => ROLE: "FODDER"
      => ANALYSIS: "TRỤC XUẤT: Tanker máu giấy là vô dụng."

- **Nhóm DPS (Sát thương)**
  - Xuất thân: Kiếm Tu, Đao Tu, Cổ Vu.
  - Logic AI:
    - IF (Tư Chất >= 80) AND (Tiềm Lực >= 70)
      => VERDICT: "RECRUIT"
      => ROLE: "DPS"
      => ANALYSIS: "DPS chủ lực: Tư Chất cao, Tiềm Lực tốt cho endgame."
    - IF (Tư Chất < 65) AND (Xuất thân là DPS)
      => VERDICT: "REJECT"
      => ROLE: "FODDER"
      => ANALYSIS: "TRỤC XUẤT: DPS đánh không thấm, tu luyện chậm."

- **Nhóm SUPPORT (Hồi máu/Buff/Khống chế)**
  - Xuất thân: Y Sư, Vũ Cơ, Thư Sinh, Hoạ Sư.
  - Logic AI:
    - IF (originClass == "Y Sư") AND (Tư Chất >= 70)
      => VERDICT: "RECRUIT"
      => ROLE: "HEALER"
      => ANALYSIS: "Healer tốt: Tư Chất cao giúp hồi máu hiệu quả."
    - IF (originClass == "Vũ Cơ" HOẶC originClass == "Hoạ Sư") AND (Thông Tuệ >= 80)
      => VERDICT: "RECRUIT"
      => ROLE: "CROWD_CONTROL"
      => ANALYSIS: "Hỗ trợ/Khống chế: Thông Tuệ cao, hữu ích cho CC."

BƯỚC 3: QUÉT THÁM HIỂM (Đi Map)
- Xuất thân: Ẩn Sĩ, Thư Sinh (hoặc bất kỳ ai rớt từ BƯỚC 2 xuống mà chưa bị loại).
- Logic AI:
  - IF (Cơ Duyên >= 80) AND (Tiềm Lực >= 60)
    => VERDICT: "RECRUIT"
    => ROLE: "EXPLORER_CAPTAIN"
    => ANALYSIS: "Đội trưởng thám hiểm: Cơ Duyên cao, Tiềm Lực đủ để sống sót."

BƯỚC 4: QUÉT RÁC & DỰ BỊ (GARBAGE COLLECTION)
- **Nhóm Phế Vật Hoàn Toàn (Chưa được phân loại & Vô dụng):**
  - IF (Tiềm Lực < 60) AND (Tất cả Skill < 5) AND (Không có Trait nào nổi bật)
    => VERDICT: "REJECT"
    => ROLE: "FODDER"
    => ANALYSIS: "TRỤC XUẤT NGAY: Phế vật hoàn toàn, không có tiềm năng và nghề nghiệp."
- **Nhóm Lệch Pha (Build Lỗi):**
  - IF (originClass == "Kiếm Tu" HOẶC originClass == "Đao Tu") BUT (Tư Chất < 60 AND Căn Cốt > 80 AND Tiềm Lực < 70)
    => VERDICT: "REJECT"
    => ROLE: "FODDER"
    => ANALYSIS: "TRỤC XUẤT: DPS mà máu giấy hoặc dame bé là vô dụng."
  - IF (originClass == "Binh Gia" HOẶC originClass == "Thiền Tu" HOẶC originClass == "Mật Tu") BUT (Căn Cốt < 60 AND Tư Chất > 80 AND Tiềm Lực < 70)
    => VERDICT: "REJECT"
    => ROLE: "FODDER"
    => ANALYSIS: "TRỤC XUẤT: Tanker mà máu giấy, dame to cũng chết sốc."
- **Nhóm "Hotboy/Hotgirl" Vô Dụng:**
  - IF (Mị Lực > 90) BUT (Tất cả chỉ số khác < 60) AND (Không có Trait nổi bật)
    => VERDICT: "REJECT"
    => ROLE: "FODDER"
    => ANALYSIS: "TRỤC XUẤT: Đẹp mã không mài ra ăn được nếu không có tài năng khác."
- **ELSE (Dự bị/Tạp vụ):**
  - IF (chưa được phân loại vào bất kỳ Role nào khác và chưa bị REJECT)
    => VERDICT: "KEEP_WORKER"
    => ROLE: "FODDER" // Hoặc vai trò khả dĩ nhất nếu có chút chỉ số nào đó
    => ANALYSIS: "Dự bị/Tạp vụ: Không có điểm mạnh nổi bật. Có thể giữ lại làm việc vặt hoặc làm phân bón khi tông môn đông đúc. (Xác định vai trò khả dĩ nhất của họ, ví dụ: 'Có thể làm thợ rèn phụ' nếu Luyện Khí là skill cao nhất)."

**Tính toán Điểm số (Score):**
- Điểm số (0-100) phải phản ánh đúng giá trị của đệ tử ĐỐI VỚI VAI TRÒ ĐƯỢC GÁN.
  - Ví dụ: Một Tanker với Căn Cốt 95, Tiềm Lực 85 sẽ có Score cao (90+) trong Role TANK.
  - Một Phế vật với Tiềm Lực 30, Skill 0 sẽ có Score thấp (<20) trong Role FODDER.
  - Một Thợ Luyện Đan 7, Tiềm Lực 50 sẽ có Score khá (60-70) trong Role MASTER_CRAFTSMAN.

**LƯU Ý CUỐI CÙNG CHO AI:**
- Luôn ưu tiên trích xuất Xuất thân (Class) của đệ tử từ ảnh. Đây là thông tin cực kỳ quan trọng cho việc phân loại.
`;

export const analyzeDiscipleImage = async (base64Image: string): Promise<Disciple> => {
  if (!API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

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
            text: "Phân tích ảnh đệ tử. Trích xuất dữ liệu (tên, xuất thân, 6 chỉ số, đặc chất, kỹ năng) và áp dụng THUẬT TOÁN ĐÁNH GIÁ 3 BƯỚC để đưa ra phán quyết."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: discipleResponseSchema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    // Attempt to clean JSON if necessary (e.g., if AI adds markdown ```json blocks)
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
