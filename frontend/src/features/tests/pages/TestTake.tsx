import { Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams } from "react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";

import { AttemptResultCard } from "../components/AttemptResultCard";
import { TakeQuestionCard } from "../components/TakeQuestionCard";
import { TestIntroCard } from "../components/TestIntroCard";
import { TimerBar } from "../components/TimerBar";
import { useTestAttempt } from "../hooks/useTestAttempt";
import { countAnswered } from "../utils";

const BACK_LINK = { to: ROUTES.home, label: "Главная" };

/** Фазалар ауысуы — жұмсақ, қысқа; сұрақтар аздап кешігіп шығады. */
const PHASE_MOTION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: "easeOut" },
} as const;
const QUESTION_STAGGER_S = 0.03;
const QUESTION_STAGGER_MAX_S = 0.3;

export default function TestTake() {
  const { id } = useParams();
  const attempt = useTestAttempt(id);
  const { take, result } = attempt;

  if (attempt.isHistoryLoading) return <PageSkeleton />;

  const title = take?.title ?? "Тест";
  const description = take
    ? `${take.questions.length} вопросов · ${take.max_score} баллов`
    : undefined;

  return (
    <>
      <PageHeader title={title} description={description} back={BACK_LINK} />

      <AnimatePresence mode="wait" initial={false}>
        {take ? (
          <motion.div key={`take-${take.attempt_id}`} {...PHASE_MOTION} className="space-y-4">
            <TimerBar
              secondsLeft={attempt.secondsLeft}
              answeredCount={countAnswered(take.questions, attempt.answers)}
              totalCount={take.questions.length}
            />

            {take.description && (
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {take.description}
              </p>
            )}

            {take.questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.18,
                  delay: Math.min(index * QUESTION_STAGGER_S, QUESTION_STAGGER_MAX_S),
                }}
              >
                <TakeQuestionCard
                  question={question}
                  index={index}
                  answer={attempt.answers[question.id]}
                  onAnswer={(patch) => attempt.updateAnswer(question.id, patch)}
                />
              </motion.div>
            ))}

            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                onClick={() => void attempt.finish()}
                isLoading={attempt.isFinishing}
              >
                {!attempt.isFinishing && <Send aria-hidden />}
                Завершить тест
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" {...PHASE_MOTION} className="space-y-6">
            {result && <AttemptResultCard result={result} />}
            <TestIntroCard
              history={attempt.history}
              isStarting={attempt.isStarting}
              onStart={() => void attempt.start()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
