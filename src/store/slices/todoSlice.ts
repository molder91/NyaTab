import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import todoService, { TodoItem } from '../../services/todoService';
import { logError } from '../../utils/errorUtils';

/**
 * Interface for the todo state
 */
export interface TodoState {
  todos: TodoItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial state for the todo slice
 */
const initialState: TodoState = {
  todos: [],
  isLoading: false,
  error: null
};

/**
 * Async thunk for loading todos from storage
 */
export const loadTodos = createAsyncThunk(
  'todos/loadTodos',
  async (_, { rejectWithValue }) => {
    try {
      return await todoService.getTodos();
    } catch (error) {
      logError('Failed to load todos', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load todos');
    }
  }
);

/**
 * Async thunk for adding a todo
 */
export const addTodo = createAsyncThunk(
  'todos/addTodo',
  async (
    { 
      title, 
      dueDate, 
      priority, 
      category 
    }: { 
      title: string; 
      dueDate?: string; 
      priority?: 'low' | 'medium' | 'high'; 
      category?: string 
    }, 
    { rejectWithValue }
  ) => {
    try {
      return await todoService.addTodo(title, dueDate, priority, category);
    } catch (error) {
      logError('Failed to add todo', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add todo');
    }
  }
);

/**
 * Async thunk for updating a todo
 */
export const updateTodo = createAsyncThunk(
  'todos/updateTodo',
  async (
    { 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>> 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const updatedTodo = await todoService.updateTodo(id, updates);
      if (!updatedTodo) {
        return rejectWithValue('Todo not found');
      }
      return updatedTodo;
    } catch (error) {
      logError('Failed to update todo', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update todo');
    }
  }
);

/**
 * Async thunk for toggling a todo
 */
export const toggleTodo = createAsyncThunk(
  'todos/toggleTodo',
  async (id: string, { rejectWithValue }) => {
    try {
      const updatedTodo = await todoService.toggleTodo(id);
      if (!updatedTodo) {
        return rejectWithValue('Todo not found');
      }
      return updatedTodo;
    } catch (error) {
      logError('Failed to toggle todo', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to toggle todo');
    }
  }
);

/**
 * Async thunk for removing a todo
 */
export const removeTodo = createAsyncThunk(
  'todos/removeTodo',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = await todoService.removeTodo(id);
      if (!success) {
        return rejectWithValue('Todo not found');
      }
      return id;
    } catch (error) {
      logError('Failed to remove todo', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove todo');
    }
  }
);

/**
 * Async thunk for clearing completed todos
 */
export const clearCompleted = createAsyncThunk(
  'todos/clearCompleted',
  async (_, { rejectWithValue }) => {
    try {
      return await todoService.clearCompleted();
    } catch (error) {
      logError('Failed to clear completed todos', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to clear completed todos');
    }
  }
);

/**
 * Todo slice
 */
const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Handle loadTodos
    builder
      .addCase(loadTodos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadTodos.fulfilled, (state, action) => {
        state.todos = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loadTodos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to load todos';
      });
    
    // Handle addTodo
    builder
      .addCase(addTodo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addTodo.fulfilled, (state, action) => {
        state.todos.push(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addTodo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to add todo';
      });
    
    // Handle updateTodo
    builder
      .addCase(updateTodo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        const index = state.todos.findIndex(todo => todo.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update todo';
      });
    
    // Handle toggleTodo
    builder
      .addCase(toggleTodo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleTodo.fulfilled, (state, action) => {
        const index = state.todos.findIndex(todo => todo.id === action.payload.id);
        if (index !== -1) {
          state.todos[index] = action.payload;
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(toggleTodo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to toggle todo';
      });
    
    // Handle removeTodo
    builder
      .addCase(removeTodo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeTodo.fulfilled, (state, action) => {
        state.todos = state.todos.filter(todo => todo.id !== action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(removeTodo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to remove todo';
      });
    
    // Handle clearCompleted
    builder
      .addCase(clearCompleted.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCompleted.fulfilled, (state) => {
        state.todos = state.todos.filter(todo => !todo.completed);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(clearCompleted.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to clear completed todos';
      });
  }
});

export const { setLoading, setError } = todoSlice.actions;

export default todoSlice.reducer; 