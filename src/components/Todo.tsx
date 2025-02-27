import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  addTodo as addTodoAction, 
  updateTodo, 
  removeTodo, 
  toggleTodo, 
  loadTodos, 
  setLoading, 
  setError 
} from '../store/slices/todoSlice';
import { TodoItem } from '../services/todoService';
import { getMessage } from '../utils/i18n';
import { formatDate, DateFormat, isToday } from '../utils/dateUtils';

/**
 * Component for displaying and managing todos
 */
const Todo: React.FC = () => {
  const dispatch = useAppDispatch();
  const { todos, isLoading, error } = useAppSelector(state => state.todo);
  const [newTodoText, setNewTodoText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load todos from storage when component mounts
  useEffect(() => {
    dispatch(loadTodos());
  }, [dispatch]);

  // Handle adding a new todo
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTodoText.trim()) return;
    
    dispatch(addTodoAction({ 
      title: newTodoText.trim(),
      dueDate: undefined,
      priority: 'medium',
      category: undefined
    }));
    
    setNewTodoText('');
  };

  // Handle toggling a todo's completed status
  const handleToggleTodo = (id: string) => {
    dispatch(toggleTodo(id));
  };

  // Handle removing a todo
  const handleRemoveTodo = (id: string) => {
    dispatch(removeTodo(id));
  };

  // Handle updating a todo's title
  const handleUpdateTodo = (id: string, title: string) => {
    dispatch(updateTodo({ 
      id, 
      updates: { title } 
    }));
  };

  // Filter todos based on the selected filter
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // Count completed and total todos
  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md w-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        {getMessage('todos')}
      </h2>
      
      {/* Todo input form */}
      <form onSubmit={handleAddTodo} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder={getMessage('addTodoPlaceholder')}
            className="flex-grow px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 transition-colors"
          >
            {getMessage('add')}
          </button>
        </div>
      </form>
      
      {/* Filter tabs */}
      <div className="flex mb-4 border-b dark:border-gray-700">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 ${
            filter === 'all'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {getMessage('all')} ({totalCount})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 ${
            filter === 'active'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {getMessage('active')} ({totalCount - completedCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 ${
            filter === 'completed'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {getMessage('completed')} ({completedCount})
        </button>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Todo list */}
      {!isLoading && filteredTodos.length === 0 ? (
        <p className="text-center py-4 text-gray-500 dark:text-gray-400">
          {getMessage('noTodos')}
        </p>
      ) : (
        <ul className="divide-y dark:divide-gray-700">
          {filteredTodos.map(todo => (
            <li key={todo.id} className="py-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  className="h-5 w-5 text-blue-500 rounded focus:ring-blue-500 dark:bg-gray-700"
                />
                <span
                  className={`ml-3 flex-grow ${
                    todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'
                  }`}
                >
                  {todo.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                  {isToday(todo.createdAt) 
                    ? getMessage('today') 
                    : formatDate(todo.createdAt, DateFormat.SHORT)}
                </span>
                <button
                  onClick={() => handleRemoveTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title={getMessage('delete')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Todo; 