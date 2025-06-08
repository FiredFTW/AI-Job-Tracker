import React, { useState, useEffect } from 'react';
import api from '../utils/api'; // <-- Use our custom api instance

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
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;