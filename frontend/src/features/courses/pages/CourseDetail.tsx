import { BookOpenCheck } from "lucide-react";
import { Link, useParams } from "react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { getIsStaff } from "@/lib/permissions";
import { useCurrentUser } from "@/providers/SessionProvider";

import { CourseInfoCard } from "../components/CourseInfoCard";
import { EditCourseForm } from "../components/EditCourseForm";
import { TopicsCard } from "../components/TopicsCard";
import { useCourse } from "../hooks/useCourse";
import { getCourseSubtitle } from "../utils";

const BACK_LINK = { to: ROUTES.courses, label: "Дисциплины" } as const;

export default function CourseDetail() {
  const { id = "" } = useParams();
  const user = useCurrentUser();
  const { course, setCourse, error, reload } = useCourse(id);

  const canManage = getIsStaff(user.role);

  if (!course) {
    if (!error) return <PageSkeleton />;

    return (
      <>
        <PageHeader title="Дисциплина" back={BACK_LINK} />
        <FormError message={error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={course.name}
        description={getCourseSubtitle(course)}
        back={BACK_LINK}
        actions={
          canManage && (
            <Button asChild variant="outline">
              <Link to={ROUTES.gradebook(course.id)}>
                <BookOpenCheck aria-hidden />
                Журнал оценок
              </Link>
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <FormError message={error} />
        {canManage ? (
          <EditCourseForm course={course} onSaved={setCourse} />
        ) : (
          <CourseInfoCard course={course} />
        )}
        <TopicsCard
          courseId={course.id}
          topics={course.topics}
          canManage={canManage}
          onChanged={reload}
        />
      </div>
    </>
  );
}
