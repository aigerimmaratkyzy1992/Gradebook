import { ClipboardList } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardList,
  CardTitle,
} from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ROUTES } from "@/constants/routes";
import type { IMyAssignment } from "@/types";

import { ASSIGNMENT_FILTERS, type AssignmentFilter } from "../constants";
import { matchesFilter } from "../utils";

import { AssignmentRow } from "./AssignmentRow";

interface IAssignmentsCardProps {
  assignments: IMyAssignment[];
  isStudent: boolean;
}

function isAssignmentFilter(value: string): value is AssignmentFilter {
  return ASSIGNMENT_FILTERS.some((filter) => filter.value === value);
}

export function AssignmentsCard({ assignments, isStudent }: IAssignmentsCardProps) {
  const [filter, setFilter] = useState<AssignmentFilter>("all");

  // Сүзгі тек студентке керек: преподавательде тапсыру күйі жоқ.
  const visible = isStudent
    ? assignments.filter((item) => matchesFilter(item, filter))
    : assignments;
  const hasAssignments = assignments.length > 0;
  const canFilter = isStudent && hasAssignments;

  const list =
    visible.length === 0 ? (
      <EmptyState
        icon={ClipboardList}
        className="border-t border-border"
        title={hasAssignments ? "В этом разделе пусто" : "Заданий пока нет"}
        description={
          isStudent
            ? "Здесь появятся задания из дисциплин ваших групп"
            : "Добавьте задания в темах ваших дисциплин"
        }
      />
    ) : (
      <CardList>
        {visible.map((item) => (
          <AssignmentRow key={item.id} item={item} isStudent={isStudent} />
        ))}
      </CardList>
    );

  return (
    <Card>
      <Tabs
        value={filter}
        onValueChange={(value) => {
          if (isAssignmentFilter(value)) setFilter(value);
        }}
      >
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>{isStudent ? "Мои задания" : "Задания дисциплин"}</CardTitle>
            <CardDescription>Отсортированы по сроку сдачи</CardDescription>
          </div>
          <CardAction>
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.courses}>Все дисциплины</Link>
            </Button>
          </CardAction>
        </CardHeader>
        {canFilter && (
          <div className="px-5 pb-4">
            <TabsList aria-label="Фильтр заданий" className="w-full sm:w-fit">
              {ASSIGNMENT_FILTERS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value} className="flex-1 sm:flex-none">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}
        <TabsContent value={filter}>{list}</TabsContent>
      </Tabs>
    </Card>
  );
}
