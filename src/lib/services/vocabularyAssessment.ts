import { supabase } from '@/lib/supabase/client';

export interface AssessmentResult {
  word: string;
  mastery: string;
  level: string;
  responseTime: number;
}

export interface AssessmentSummary {
  id: string;
  assessmentDate: string;
  totalWords: number;
  averageResponseTime: number;
  results: AssessmentResult[];
}

export async function saveAssessmentResults(results: AssessmentResult[]): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return null;
  }

  try {
    // 计算平均响应时间
    const averageResponseTime = results.reduce((sum, result) => sum + result.responseTime, 0) / results.length;

    // 创建评估记录
    const { data: assessment, error: assessmentError } = await supabase
      .from('vocabulary_assessments')
      .insert({
        user_id: user.id,
        total_words: results.length,
        average_response_time: averageResponseTime,
      })
      .select()
      .single();

    if (assessmentError || !assessment) {
      console.error('Error saving assessment:', assessmentError);
      return null;
    }

    // 保存详细结果
    const { error: resultsError } = await supabase
      .from('vocabulary_assessment_results')
      .insert(
        results.map(result => ({
          assessment_id: assessment.id,
          word: result.word,
          mastery: result.mastery,
          level: result.level,
          response_time: result.responseTime,
        }))
      );

    if (resultsError) {
      console.error('Error saving assessment results:', resultsError);
      return null;
    }

    return assessment.id;
  } catch (error) {
    console.error('Error in saveAssessmentResults:', error);
    return null;
  }
}

export async function getAssessmentHistory(): Promise<AssessmentSummary[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return [];
  }

  try {
    // 获取评估记录
    const { data: assessments, error: assessmentsError } = await supabase
      .from('vocabulary_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('assessment_date', { ascending: false });

    if (assessmentsError || !assessments) {
      console.error('Error fetching assessments:', assessmentsError);
      return [];
    }

    // 获取每次评估的详细结果
    const summaries = await Promise.all(
      assessments.map(async (assessment) => {
        const { data: results, error: resultsError } = await supabase
          .from('vocabulary_assessment_results')
          .select('*')
          .eq('assessment_id', assessment.id);

        if (resultsError || !results) {
          console.error('Error fetching assessment results:', resultsError);
          return null;
        }

        return {
          id: assessment.id,
          assessmentDate: assessment.assessment_date,
          totalWords: assessment.total_words,
          averageResponseTime: assessment.average_response_time,
          results: results.map(r => ({
            word: r.word,
            mastery: r.mastery,
            level: r.level,
            responseTime: r.response_time,
          })),
        };
      })
    );

    return summaries.filter((s): s is AssessmentSummary => s !== null);
  } catch (error) {
    console.error('Error in getAssessmentHistory:', error);
    return [];
  }
}

export async function getLatestAssessment(): Promise<AssessmentSummary | null> {
  const history = await getAssessmentHistory();
  return history[0] || null;
} 