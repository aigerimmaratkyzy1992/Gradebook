type RouteId = number | string;

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  profile: "/profile",
  users: "/users",
  courses: "/courses",
  course: (id: RouteId) => `/courses/${id}`,
  gradebook: (courseId: RouteId) => `/courses/${courseId}/gradebook`,
  assignment: (id: RouteId) => `/assignments/${id}`,
  test: (id: RouteId) => `/tests/${id}`,
  testEdit: (id: RouteId) => `/tests/${id}/edit`,
  schedule: "/schedule",
  groups: "/groups",
  group: (id: RouteId) => `/groups/${id}`,
} as const;

/** Роутер үшін `:id` үлгілері — ROUTES құрастырғыштарынан, сондықтан жолдар екі жерде жазылмайды. */
const ID_PARAM = ":id";

export const ROUTE_PATTERNS = {
  course: ROUTES.course(ID_PARAM),
  gradebook: ROUTES.gradebook(ID_PARAM),
  assignment: ROUTES.assignment(ID_PARAM),
  test: ROUTES.test(ID_PARAM),
  testEdit: ROUTES.testEdit(ID_PARAM),
  group: ROUTES.group(ID_PARAM),
} as const;
