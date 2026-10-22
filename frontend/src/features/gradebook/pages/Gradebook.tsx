import { ChartColumn, ChartNoAxesColumn, Table2 } from "lucide-react";
import { useParams } from "react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormError } from "@/components/shared/FormError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ROUTES } from "@/constants/routes";

import { AverageByAssignmentChart } from "../components/AverageByAssignmentChart";
import { ExportExcelButton } from "../components/ExportExcelButton";
import { GradebookTable } from "../components/GradebookTable";
import { GradeDistributionChart } from "../components/GradeDistributionChart";
import { HardestAssignments } from "../components/HardestAssignments";
import { RankingList } from "../components/RankingList";
import { StatsCards } from "../components/StatsCards";
import { useGradebook } from "../hooks/useGradebook";
import { getScorePercents } from "../utils";

const PAGE_TITLE = "Журнал оценок";

export default function Gradebook() {
  const { id } = useParams();
  const { data, isLoading, error } = useGradebook(id);

  if (isLoading) return <PageSkeleton />;

  if (!data) {
    return (
      <>
        <PageHeader title={PAGE_TITLE} back={{ to: ROUTES.courses, label: "Дисциплины" }} />
        <FormError message={error || "Журнал не найден"} />
      </>
    );
  }

  const { course, book, stats } = data;
  const percents = getScorePercents(book);
  const hasGrades = percents.length > 0;
  const hasLeaders = stats.hardest.length > 0;

  return (
    <>
      <PageHeader
        title={PAGE_TITLE}
        description={course.name}
        back={{ to: ROUTES.course(course.id), label: course.name }}
        actions={<ExportExcelButton courseId={id} courseName={course.name} />}
      />

      <div className="space-y-6">
        <StatsCards stats={stats} />

        <Tabs defaultValue="grades" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grades">
              <Table2 aria-hidden />
              Журнал
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <ChartColumn aria-hidden />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grades">
            <GradebookTable book={book} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Графики</CardTitle>
              </CardHeader>
              {hasGrades ? (
                <CardContent className="grid gap-8 lg:grid-cols-2">
                  <AverageByAssignmentChart book={book} />
                  <GradeDistributionChart percents={percents} />
                </CardContent>
              ) : (
                <EmptyState
                  icon={ChartNoAxesColumn}
                  title="Пока нет оценённых работ"
                  description="Графики появятся после первой проверки."
                  className="border-t border-border"
                />
              )}
            </Card>

            {hasLeaders && (
              <Card>
                <CardHeader>
                  <CardTitle>Успеваемость</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-2">
                  <HardestAssignments hardest={stats.hardest} />
                  <RankingList ranking={stats.ranking} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
