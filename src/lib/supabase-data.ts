import { DataService, Employee, Client, ContentItem, Task, NetworkingEntry, EngagementEntry, CalendarEvent } from "@/services/dataService";

export async function fetchDashboardSnapshot() {
  return DataService.getDashboardStats();
}

export async function fetchEmployees<T = Employee>(): Promise<T[]> {
  return DataService.getUsers() as unknown as T[];
}

export async function fetchClients<T = Client>(): Promise<T[]> {
  return DataService.getClients() as unknown as T[];
}

export async function fetchProjects() {
  return DataService.getProjects();
}

export async function fetchContent<T = ContentItem>(): Promise<T[]> {
  return DataService.getContent() as unknown as T[];
}

export async function fetchTasks<T = Task>(): Promise<T[]> {
  return DataService.getTasks() as unknown as T[];
}

export async function fetchNetworking<T = NetworkingEntry>(): Promise<T[]> {
  return DataService.getNetworking() as unknown as T[];
}

export async function fetchEngagement<T = EngagementEntry>(): Promise<T[]> {
  return DataService.getEngagement() as unknown as T[];
}

export async function fetchCalendarEvents<T = CalendarEvent>(): Promise<T[]> {
  return DataService.getEvents() as unknown as T[];
}
