import { TodoState } from '../store/slices/todoSlice';
import { logError } from '../utils/errorUtils';
import storageService from './storageService';

/**
 * Interface for a todo item
 */
export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

/**
 * Service for managing todos
 */
const todoService = {
  /**
   * Get all todos
   * @returns Promise with an array of todos
   */
  getTodos: async (): Promise<TodoItem[]> => {
    try {
      return await storageService.getTodos();
    } catch (error) {
      logError('Failed to get todos', error);
      throw error;
    }
  },
  
  /**
   * Save todos
   * @param todos - Array of todos to save
   */
  saveTodos: async (todos: TodoItem[]): Promise<void> => {
    try {
      await storageService.saveTodos(todos);
    } catch (error) {
      logError('Failed to save todos', error);
      throw error;
    }
  },
  
  /**
   * Add a new todo
   * @param title - Title of the todo
   * @param dueDate - Optional due date
   * @param priority - Optional priority
   * @param category - Optional category
   * @returns The newly created todo
   */
  addTodo: async (
    title: string,
    dueDate?: string,
    priority?: 'low' | 'medium' | 'high',
    category?: string
  ): Promise<TodoItem> => {
    try {
      const todos = await storageService.getTodos();
      
      const newTodo: TodoItem = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate,
        priority,
        category
      };
      
      todos.push(newTodo);
      await storageService.saveTodos(todos);
      
      return newTodo;
    } catch (error) {
      logError('Failed to add todo', error);
      throw error;
    }
  },
  
  /**
   * Update a todo
   * @param id - ID of the todo to update
   * @param updates - Partial todo with updates
   * @returns The updated todo or null if not found
   */
  updateTodo: async (
    id: string,
    updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>
  ): Promise<TodoItem | null> => {
    try {
      const todos = await storageService.getTodos();
      const todoIndex = todos.findIndex(todo => todo.id === id);
      
      if (todoIndex === -1) {
        return null;
      }
      
      const updatedTodo = {
        ...todos[todoIndex],
        ...updates
      };
      
      todos[todoIndex] = updatedTodo;
      await storageService.saveTodos(todos);
      
      return updatedTodo;
    } catch (error) {
      logError('Failed to update todo', error);
      throw error;
    }
  },
  
  /**
   * Toggle a todo's completed status
   * @param id - ID of the todo to toggle
   * @returns The updated todo or null if not found
   */
  toggleTodo: async (id: string): Promise<TodoItem | null> => {
    try {
      const todos = await storageService.getTodos();
      const todoIndex = todos.findIndex(todo => todo.id === id);
      
      if (todoIndex === -1) {
        return null;
      }
      
      const updatedTodo = {
        ...todos[todoIndex],
        completed: !todos[todoIndex].completed
      };
      
      todos[todoIndex] = updatedTodo;
      await storageService.saveTodos(todos);
      
      return updatedTodo;
    } catch (error) {
      logError('Failed to toggle todo', error);
      throw error;
    }
  },
  
  /**
   * Remove a todo
   * @param id - ID of the todo to remove
   * @returns True if the todo was removed, false if not found
   */
  removeTodo: async (id: string): Promise<boolean> => {
    try {
      const todos = await storageService.getTodos();
      const initialLength = todos.length;
      
      const filteredTodos = todos.filter(todo => todo.id !== id);
      
      if (filteredTodos.length === initialLength) {
        return false;
      }
      
      await storageService.saveTodos(filteredTodos);
      return true;
    } catch (error) {
      logError('Failed to remove todo', error);
      throw error;
    }
  },
  
  /**
   * Clear completed todos
   * @returns The number of todos removed
   */
  clearCompleted: async (): Promise<number> => {
    try {
      const todos = await storageService.getTodos();
      const initialLength = todos.length;
      
      const filteredTodos = todos.filter(todo => !todo.completed);
      const removedCount = initialLength - filteredTodos.length;
      
      await storageService.saveTodos(filteredTodos);
      return removedCount;
    } catch (error) {
      logError('Failed to clear completed todos', error);
      throw error;
    }
  }
};

export default todoService; 