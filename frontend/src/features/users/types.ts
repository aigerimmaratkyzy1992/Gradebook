import type { IUser } from "@/types";

/** Сброс нәтижесі: admin стандартты парольді пайдаланушыға өзі береді. */
export interface IPasswordReset extends Pick<IUser, "email"> {
  password: string;
}
