import { ChartColumn, ListChecks, Settings2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { FormError } from "@/components/shared/FormError";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ROUTES } from "@/constants/routes";
import type { TestFull } from "@/types";

import { AttemptsTable } from "../components/AttemptsTable";
import { QuestionEditor } from "../components/QuestionEditor";
import { QuestionList } from "../components/QuestionList";
import { TestSettingsForm } from "../components/TestSettingsForm";
import { useTestEditor } from "../hooks/useTestEditor";
import type { IQuestionPayload } from "../types";

const BACK_LINK = { to: ROUTES.courses, label: "Дисциплины" };

function describeTest(test: TestFull): string {
  const timer = test.time_limit_minutes ? `${test.time_limit_minutes} мин` : "без таймера";
  return `${test.questions.length} вопросов · ${test.max_score} баллов · ${timer} · попыток: ${test.attempts_allowed}`;
}

export default function TestEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editor = useTestEditor(id);
  const { test, attempts } = editor;

  async function handleAddQuestion(payload: IQuestionPayload) {
    await editor.addQuestion(payload);
    toast.success("Вопрос добавлен");
  }

  async function handleDeleteTest() {
    await editor.deleteTest();
    toast.success("Тест удалён");
    navigate(ROUTES.courses, { replace: true });
  }

  if (editor.isLoading) return <PageSkeleton />;

  if (!test) {
    return (
      <>
        <PageHeader title="Тест" back={BACK_LINK} />
        <FormError message={editor.loadError || "Тест не найден"} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={test.title} description={describeTest(test)} back={BACK_LINK} />

      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="questions">
            <ListChecks aria-hidden />
            Вопросы
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 aria-hidden />
            Настройки
          </TabsTrigger>
          <TabsTrigger value="results">
            <ChartColumn aria-hidden />
            Результаты
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Новый вопрос</CardTitle>
                <CardDescription>Выберите тип — поля ответа изменятся под него.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <QuestionEditor submitLabel="Добавить вопрос" onSubmit={handleAddQuestion} />
            </CardContent>
          </Card>

          <QuestionList
            questions={test.questions}
            maxScore={test.max_score}
            onUpdate={editor.updateQuestion}
            onDelete={editor.deleteQuestion}
          />
        </TabsContent>

        <TabsContent value="settings">
          <TestSettingsForm test={test} onSave={editor.saveSettings} onDelete={handleDeleteTest} />
        </TabsContent>

        <TabsContent value="results">
          <AttemptsTable rows={attempts} />
        </TabsContent>
      </Tabs>
    </>
  );
}
