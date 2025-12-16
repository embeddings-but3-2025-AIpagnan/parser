interface Task {
  id: number;
  title: string;
}

type Priority = 'low' | 'medium' | 'high';

class TaskManager {
  private tasks: Task[];
  
  constructor() {
    this.tasks = [];
  }
  
  addTask(title: string): Task {
    const newTask: Task = {
      id: 1,
      title: title
    };
    return newTask;
  }
}