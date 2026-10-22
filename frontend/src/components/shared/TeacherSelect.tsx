import { NativeSelect } from "@/components/ui/NativeSelect";
import { getDisplayName } from "@/lib/utils";
import type { IUser } from "@/types";

type TeacherOption = Pick<IUser, "id" | "full_name" | "email">;

interface ITeacherSelectProps {
  id: string;
  teachers: TeacherOption[];
  /**
   * Қазір тағайындалған преподаватель — әрқашан опция болып шығады. Әйтпесе тізім
   * жүктелгенше (не жүктелмесе, не ол admin рөлінде болса) өріс «Без преподавателя»
   * көрсетер еді, ал күйде нақты id тұрады.
   */
  currentTeacher?: TeacherOption | null;
  /** Таңдалған преподавательдің id-і, бос жол — «Без преподавателя». */
  value: string;
  onChange: (value: string) => void;
}

/** Басқарылатын өріс: тізім кеш жүктелсе де таңдалған мән жоғалмайды. */
export function TeacherSelect({ id, teachers, currentTeacher, value, onChange }: ITeacherSelectProps) {
  const isCurrentMissing =
    currentTeacher != null && !teachers.some((teacher) => teacher.id === currentTeacher.id);
  const options = isCurrentMissing ? [currentTeacher, ...teachers] : teachers;

  return (
    <NativeSelect
      id={id}
      name="teacher_id"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Без преподавателя</option>
      {options.map((teacher) => (
        <option key={teacher.id} value={teacher.id}>
          {getDisplayName(teacher)}
        </option>
      ))}
    </NativeSelect>
  );
}
