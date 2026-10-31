import api from "../lib/api";

export interface ExpertQuestionItem {
  id: string;
  userId: string;
  question: string;
  crop?: string;
  category?: string;
  answer?: string;
  answeredBy?: string;
  audioAnswerUrl?: string;
  status: "PENDING" | "ANSWERED";
  createdAt: string;
  user?: {
    name: string;
    state?: string;
    district?: string;
  };
}

export async function fetchExpertQuestions(params?: {
  crop?: string;
  category?: string;
  status?: string;
}): Promise<{ questions: ExpertQuestionItem[] }> {
  const res = await api.get<{ questions: ExpertQuestionItem[] }>("/expert/questions", { params });
  return res.data;
}

export async function askExpert(data: {
  question: string;
  crop?: string;
  category?: string;
}): Promise<{ question: ExpertQuestionItem; message: string }> {
  const res = await api.post<{ question: ExpertQuestionItem; message: string }>("/expert/questions", data);
  return res.data;
}

export async function fetchMyQuestions(): Promise<{ questions: ExpertQuestionItem[] }> {
  const res = await api.get<{ questions: ExpertQuestionItem[] }>("/expert/my-questions");
  return res.data;
}

export async function answerQuestion(
  id: string,
  data: { answer: string; audioAnswerUrl?: string; answeredBy?: string }
): Promise<{ question: ExpertQuestionItem; message: string }> {
  const res = await api.post<{ question: ExpertQuestionItem; message: string }>(`/expert/questions/${id}/answer`, data);
  return res.data;
}
