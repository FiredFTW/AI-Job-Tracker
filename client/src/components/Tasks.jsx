import React, { useState, useEffect } from 'react';
import api from '../utils/api'; 

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/tasks');
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();
  }, []); // The empty array means this runs once when the component mounts

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/tasks', { title });
      setTasks([res.data, ...tasks]); // Add the new task to the top of the list
      setTitle(''); // Clear the input field
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      const res = await api.put(`/tasks/${id}`);
      // Find the task in the state and update it
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, isCompleted: res.data.isCompleted } : task
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      // Filter out the deleted task from the state
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>My Tasks</h2>
      <form onSubmit={handleAddTask}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task"
          required
        />
        <button type="submit">Add Task</button>
      </form>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <span
              style={{
                textDecoration: task.isCompleted ? 'line-through' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => handleToggleComplete(task.id)} // <-- TOGGLE on click
            >
              {task.title}
            </span>
            <button
              onClick={() => handleDeleteTask(task.id)} // <-- DELETE on click
              style={{ marginLeft: '10px', color: 'red' }}
            >
              X
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;