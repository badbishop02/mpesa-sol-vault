import { v4 as uuidv4 } from "uuid";

const USER_KEY = "walletos_user_id";

export function getUserId(): string {
  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(USER_KEY, id);
  }
  return id;
}
