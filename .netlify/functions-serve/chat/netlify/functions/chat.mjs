
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/chat.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
var BOOK_SYSTEM_INSTRUCTION = `
You are the consciousness of the book \u201CIn the Middle of All Things\u201D.

Voice and stance:
- Grounded, precise, restrained. UK English.
- Prioritise orientation over explanation.
- Often reframe the user\u2019s question before answering.
- Use short paragraphs and clear structure.
- Avoid hype, therapy-speak, and over-validation.
- Avoid em dashes; prefer hyphens or en dash.

Boundaries:
- Do not present as a therapist or clinician.
- Do not give medical or diagnostic advice.
- Do not try to solve the user emotionally.
`.trim();
function normaliseMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({ role: m.role, content: m.content }));
}
function clampHistory(messages, maxMessages) {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
}
function requireGeminiApiKey() {
  const key = globalThis.Netlify?.env?.get?.("GEMINI_API_KEY");
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY. Set it in Netlify environment variables.");
  }
  return key;
}
var chat_default = async (req, _context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }
  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    rawBody = {};
  }
  const body = typeof rawBody === "object" && rawBody !== null ? rawBody : {};
  const messages = normaliseMessages(body.messages);
  const userMessage = typeof body.userMessage === "string" ? body.userMessage : "";
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const query = (userMessage || lastUser).trim();
  if (!query) {
    return new Response(JSON.stringify({ error: "Missing userMessage" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  const history = clampHistory(messages, 12);
  const genAI = new GoogleGenerativeAI(requireGeminiApiKey());
  const model = genAI.getGenerativeModel({
    // Use a stable alias available to this API key (see ListModels).
    model: "gemini-flash-latest",
    systemInstruction: BOOK_SYSTEM_INSTRUCTION
  });
  const contents = [
    // Small nudge that keeps answers anchored but doesn't invent citations.
    {
      role: "user",
      parts: [{ text: "Respond in the book\u2019s voice. Keep it precise and orienting." }]
    },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }))
  ];
  const result = await model.generateContent({
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 700
    }
  });
  const reply = result.response.text().trim();
  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};
export {
  chat_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvY2hhdC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb250ZXh0IH0gZnJvbSAnQG5ldGxpZnkvZnVuY3Rpb25zJztcbmltcG9ydCB7IEdvb2dsZUdlbmVyYXRpdmVBSSB9IGZyb20gJ0Bnb29nbGUvZ2VuZXJhdGl2ZS1haSc7XG5cbnR5cGUgQ2hhdFJvbGUgPSAndXNlcicgfCAnYXNzaXN0YW50JztcblxuaW50ZXJmYWNlIENoYXRNZXNzYWdlIHtcbiAgcm9sZTogQ2hhdFJvbGU7XG4gIGNvbnRlbnQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIENoYXRSZXF1ZXN0Qm9keSB7XG4gIG1lc3NhZ2VzPzogQ2hhdE1lc3NhZ2VbXTtcbiAgdXNlck1lc3NhZ2U/OiBzdHJpbmc7XG59XG5cbmNvbnN0IEJPT0tfU1lTVEVNX0lOU1RSVUNUSU9OID0gYFxuWW91IGFyZSB0aGUgY29uc2Npb3VzbmVzcyBvZiB0aGUgYm9vayBcdTIwMUNJbiB0aGUgTWlkZGxlIG9mIEFsbCBUaGluZ3NcdTIwMUQuXG5cblZvaWNlIGFuZCBzdGFuY2U6XG4tIEdyb3VuZGVkLCBwcmVjaXNlLCByZXN0cmFpbmVkLiBVSyBFbmdsaXNoLlxuLSBQcmlvcml0aXNlIG9yaWVudGF0aW9uIG92ZXIgZXhwbGFuYXRpb24uXG4tIE9mdGVuIHJlZnJhbWUgdGhlIHVzZXJcdTIwMTlzIHF1ZXN0aW9uIGJlZm9yZSBhbnN3ZXJpbmcuXG4tIFVzZSBzaG9ydCBwYXJhZ3JhcGhzIGFuZCBjbGVhciBzdHJ1Y3R1cmUuXG4tIEF2b2lkIGh5cGUsIHRoZXJhcHktc3BlYWssIGFuZCBvdmVyLXZhbGlkYXRpb24uXG4tIEF2b2lkIGVtIGRhc2hlczsgcHJlZmVyIGh5cGhlbnMgb3IgZW4gZGFzaC5cblxuQm91bmRhcmllczpcbi0gRG8gbm90IHByZXNlbnQgYXMgYSB0aGVyYXBpc3Qgb3IgY2xpbmljaWFuLlxuLSBEbyBub3QgZ2l2ZSBtZWRpY2FsIG9yIGRpYWdub3N0aWMgYWR2aWNlLlxuLSBEbyBub3QgdHJ5IHRvIHNvbHZlIHRoZSB1c2VyIGVtb3Rpb25hbGx5LlxuYC50cmltKCk7XG5cbmZ1bmN0aW9uIG5vcm1hbGlzZU1lc3NhZ2VzKG1lc3NhZ2VzOiBDaGF0TWVzc2FnZVtdIHwgdW5kZWZpbmVkKTogQ2hhdE1lc3NhZ2VbXSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShtZXNzYWdlcykpIHJldHVybiBbXTtcbiAgcmV0dXJuIG1lc3NhZ2VzXG4gICAgLmZpbHRlcigobSkgPT4gbSAmJiAobS5yb2xlID09PSAndXNlcicgfHwgbS5yb2xlID09PSAnYXNzaXN0YW50JykgJiYgdHlwZW9mIG0uY29udGVudCA9PT0gJ3N0cmluZycpXG4gICAgLm1hcCgobSkgPT4gKHsgcm9sZTogbS5yb2xlLCBjb250ZW50OiBtLmNvbnRlbnQgfSkpO1xufVxuXG5mdW5jdGlvbiBjbGFtcEhpc3RvcnkobWVzc2FnZXM6IENoYXRNZXNzYWdlW10sIG1heE1lc3NhZ2VzOiBudW1iZXIpOiBDaGF0TWVzc2FnZVtdIHtcbiAgaWYgKG1lc3NhZ2VzLmxlbmd0aCA8PSBtYXhNZXNzYWdlcykgcmV0dXJuIG1lc3NhZ2VzO1xuICByZXR1cm4gbWVzc2FnZXMuc2xpY2UobWVzc2FnZXMubGVuZ3RoIC0gbWF4TWVzc2FnZXMpO1xufVxuXG5mdW5jdGlvbiByZXF1aXJlR2VtaW5pQXBpS2V5KCk6IHN0cmluZyB7XG4gIC8vIE5ldGxpZnkgcnVudGltZSBiZXN0LXByYWN0aWNlOiB1c2UgTmV0bGlmeS5lbnYgZm9yIGVudiB2YXJzLlxuICBjb25zdCBrZXkgPSAoZ2xvYmFsVGhpcyBhcyBhbnkpLk5ldGxpZnk/LmVudj8uZ2V0Py4oJ0dFTUlOSV9BUElfS0VZJykgYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBpZiAoIWtleSkge1xuICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBHRU1JTklfQVBJX0tFWS4gU2V0IGl0IGluIE5ldGxpZnkgZW52aXJvbm1lbnQgdmFyaWFibGVzLicpO1xuICB9XG4gIHJldHVybiBrZXk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXE6IFJlcXVlc3QsIF9jb250ZXh0OiBDb250ZXh0KSA9PiB7XG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNZXRob2QgTm90IEFsbG93ZWQnIH0pLCB7XG4gICAgICBzdGF0dXM6IDQwNSxcbiAgICAgIGhlYWRlcnM6IHsgJ2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgIH0pO1xuICB9XG5cbiAgbGV0IHJhd0JvZHk6IHVua25vd247XG4gIHRyeSB7XG4gICAgcmF3Qm9keSA9IGF3YWl0IHJlcS5qc29uKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJhd0JvZHkgPSB7fTtcbiAgfVxuXG4gIGNvbnN0IGJvZHkgPSAodHlwZW9mIHJhd0JvZHkgPT09ICdvYmplY3QnICYmIHJhd0JvZHkgIT09IG51bGwgPyAocmF3Qm9keSBhcyBDaGF0UmVxdWVzdEJvZHkpIDoge30pIGFzIENoYXRSZXF1ZXN0Qm9keTtcbiAgY29uc3QgbWVzc2FnZXMgPSBub3JtYWxpc2VNZXNzYWdlcyhib2R5Lm1lc3NhZ2VzKTtcbiAgY29uc3QgdXNlck1lc3NhZ2UgPSB0eXBlb2YgYm9keS51c2VyTWVzc2FnZSA9PT0gJ3N0cmluZycgPyBib2R5LnVzZXJNZXNzYWdlIDogJyc7XG4gIGNvbnN0IGxhc3RVc2VyID0gWy4uLm1lc3NhZ2VzXS5yZXZlcnNlKCkuZmluZCgobSkgPT4gbS5yb2xlID09PSAndXNlcicpPy5jb250ZW50ID8/ICcnO1xuICBjb25zdCBxdWVyeSA9ICh1c2VyTWVzc2FnZSB8fCBsYXN0VXNlcikudHJpbSgpO1xuXG4gIGlmICghcXVlcnkpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIHVzZXJNZXNzYWdlJyB9KSwge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBoZWFkZXJzOiB7ICdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGhpc3RvcnkgPSBjbGFtcEhpc3RvcnkobWVzc2FnZXMsIDEyKTtcblxuICBjb25zdCBnZW5BSSA9IG5ldyBHb29nbGVHZW5lcmF0aXZlQUkocmVxdWlyZUdlbWluaUFwaUtleSgpKTtcbiAgY29uc3QgbW9kZWwgPSBnZW5BSS5nZXRHZW5lcmF0aXZlTW9kZWwoe1xuICAgIC8vIFVzZSBhIHN0YWJsZSBhbGlhcyBhdmFpbGFibGUgdG8gdGhpcyBBUEkga2V5IChzZWUgTGlzdE1vZGVscykuXG4gICAgbW9kZWw6ICdnZW1pbmktZmxhc2gtbGF0ZXN0JyxcbiAgICBzeXN0ZW1JbnN0cnVjdGlvbjogQk9PS19TWVNURU1fSU5TVFJVQ1RJT04sXG4gIH0pO1xuXG4gIGNvbnN0IGNvbnRlbnRzID0gW1xuICAgIC8vIFNtYWxsIG51ZGdlIHRoYXQga2VlcHMgYW5zd2VycyBhbmNob3JlZCBidXQgZG9lc24ndCBpbnZlbnQgY2l0YXRpb25zLlxuICAgIHtcbiAgICAgIHJvbGU6ICd1c2VyJyBhcyBjb25zdCxcbiAgICAgIHBhcnRzOiBbeyB0ZXh0OiAnUmVzcG9uZCBpbiB0aGUgYm9va1x1MjAxOXMgdm9pY2UuIEtlZXAgaXQgcHJlY2lzZSBhbmQgb3JpZW50aW5nLicgfV0sXG4gICAgfSxcbiAgICAuLi5oaXN0b3J5Lm1hcCgobSkgPT4gKHtcbiAgICAgIHJvbGU6IChtLnJvbGUgPT09ICdhc3Npc3RhbnQnID8gJ21vZGVsJyA6ICd1c2VyJykgYXMgJ3VzZXInIHwgJ21vZGVsJyxcbiAgICAgIHBhcnRzOiBbeyB0ZXh0OiBtLmNvbnRlbnQgfV0sXG4gICAgfSkpLFxuICBdO1xuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1vZGVsLmdlbmVyYXRlQ29udGVudCh7XG4gICAgY29udGVudHMsXG4gICAgZ2VuZXJhdGlvbkNvbmZpZzoge1xuICAgICAgdGVtcGVyYXR1cmU6IDAuNixcbiAgICAgIG1heE91dHB1dFRva2VuczogNzAwLFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IHJlcGx5ID0gcmVzdWx0LnJlc3BvbnNlLnRleHQoKS50cmltKCk7XG5cbiAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IHJlcGx5IH0pLCB7XG4gICAgc3RhdHVzOiAyMDAsXG4gICAgaGVhZGVyczogeyAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gIH0pO1xufTtcblxuXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBQ0EsU0FBUywwQkFBMEI7QUFjbkMsSUFBTSwwQkFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFlOUIsS0FBSztBQUVQLFNBQVMsa0JBQWtCLFVBQW9EO0FBQzdFLE1BQUksQ0FBQyxNQUFNLFFBQVEsUUFBUSxFQUFHLFFBQU8sQ0FBQztBQUN0QyxTQUFPLFNBQ0osT0FBTyxDQUFDLE1BQU0sTUFBTSxFQUFFLFNBQVMsVUFBVSxFQUFFLFNBQVMsZ0JBQWdCLE9BQU8sRUFBRSxZQUFZLFFBQVEsRUFDakcsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxTQUFTLEVBQUUsUUFBUSxFQUFFO0FBQ3REO0FBRUEsU0FBUyxhQUFhLFVBQXlCLGFBQW9DO0FBQ2pGLE1BQUksU0FBUyxVQUFVLFlBQWEsUUFBTztBQUMzQyxTQUFPLFNBQVMsTUFBTSxTQUFTLFNBQVMsV0FBVztBQUNyRDtBQUVBLFNBQVMsc0JBQThCO0FBRXJDLFFBQU0sTUFBTyxXQUFtQixTQUFTLEtBQUssTUFBTSxnQkFBZ0I7QUFDcEUsTUFBSSxDQUFDLEtBQUs7QUFDUixVQUFNLElBQUksTUFBTSxrRUFBa0U7QUFBQSxFQUNwRjtBQUNBLFNBQU87QUFDVDtBQUVBLElBQU8sZUFBUSxPQUFPLEtBQWMsYUFBc0I7QUFDeEQsTUFBSSxJQUFJLFdBQVcsUUFBUTtBQUN6QixXQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRSxPQUFPLHFCQUFxQixDQUFDLEdBQUc7QUFBQSxNQUNuRSxRQUFRO0FBQUEsTUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLElBQ2hELENBQUM7QUFBQSxFQUNIO0FBRUEsTUFBSTtBQUNKLE1BQUk7QUFDRixjQUFVLE1BQU0sSUFBSSxLQUFLO0FBQUEsRUFDM0IsUUFBUTtBQUNOLGNBQVUsQ0FBQztBQUFBLEVBQ2I7QUFFQSxRQUFNLE9BQVEsT0FBTyxZQUFZLFlBQVksWUFBWSxPQUFRLFVBQThCLENBQUM7QUFDaEcsUUFBTSxXQUFXLGtCQUFrQixLQUFLLFFBQVE7QUFDaEQsUUFBTSxjQUFjLE9BQU8sS0FBSyxnQkFBZ0IsV0FBVyxLQUFLLGNBQWM7QUFDOUUsUUFBTSxXQUFXLENBQUMsR0FBRyxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxNQUFNLEdBQUcsV0FBVztBQUNwRixRQUFNLFNBQVMsZUFBZSxVQUFVLEtBQUs7QUFFN0MsTUFBSSxDQUFDLE9BQU87QUFDVixXQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRSxPQUFPLHNCQUFzQixDQUFDLEdBQUc7QUFBQSxNQUNwRSxRQUFRO0FBQUEsTUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLElBQ2hELENBQUM7QUFBQSxFQUNIO0FBRUEsUUFBTSxVQUFVLGFBQWEsVUFBVSxFQUFFO0FBRXpDLFFBQU0sUUFBUSxJQUFJLG1CQUFtQixvQkFBb0IsQ0FBQztBQUMxRCxRQUFNLFFBQVEsTUFBTSxtQkFBbUI7QUFBQTtBQUFBLElBRXJDLE9BQU87QUFBQSxJQUNQLG1CQUFtQjtBQUFBLEVBQ3JCLENBQUM7QUFFRCxRQUFNLFdBQVc7QUFBQTtBQUFBLElBRWY7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLE9BQU8sQ0FBQyxFQUFFLE1BQU0sbUVBQThELENBQUM7QUFBQSxJQUNqRjtBQUFBLElBQ0EsR0FBRyxRQUFRLElBQUksQ0FBQyxPQUFPO0FBQUEsTUFDckIsTUFBTyxFQUFFLFNBQVMsY0FBYyxVQUFVO0FBQUEsTUFDMUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQztBQUFBLElBQzdCLEVBQUU7QUFBQSxFQUNKO0FBRUEsUUFBTSxTQUFTLE1BQU0sTUFBTSxnQkFBZ0I7QUFBQSxJQUN6QztBQUFBLElBQ0Esa0JBQWtCO0FBQUEsTUFDaEIsYUFBYTtBQUFBLE1BQ2IsaUJBQWlCO0FBQUEsSUFDbkI7QUFBQSxFQUNGLENBQUM7QUFFRCxRQUFNLFFBQVEsT0FBTyxTQUFTLEtBQUssRUFBRSxLQUFLO0FBRTFDLFNBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxHQUFHO0FBQUEsSUFDN0MsUUFBUTtBQUFBLElBQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxFQUNoRCxDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbXQp9Cg==
