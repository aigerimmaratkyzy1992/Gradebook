export interface INotification {
  id: number;
  text: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface INotificationFeed {
  unread: number;
  items: INotification[];
}
