"use client";
import React, { useState, useEffect } from "react";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "./StrictModeDroppable";
import axios from "axios";

const API_URL = "http://localhost:8080/todolist";

export const KanbanBoard = () => {
  const [columns, setColumns] = useState({
    "To Do": { name: "TO DO", items: [] },
    "In Progress": { name: "IN PROGRESS", items: [] },
    Completed: { name: "COMPLETED", items: [] },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    status: "",
  });
  const [editingTask, setEditingTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      if (response.data.success) {
        const tasks = response.data.data;
        const newColumns = {
          "To Do": { name: "TO DO", items: [] },
          "In Progress": { name: "IN PROGRESS", items: [] },
          Completed: { name: "COMPLETED", items: [] },
        };
        tasks.forEach((task) => {
          newColumns[task.status].items.push(task);
        });
        setColumns(newColumns);
        setIsLoading(false);
      } else {
        throw new Error(response.data.message || "Failed to fetch tasks");
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const addTask = async () => {
    if (newTask.title) {
      try {
        const response = await axios.post(`${API_URL}/tasks`, newTask);
        if (response.data.success) {
          const addedTask = response.data.data;
          setColumns((prevColumns) => ({
            ...prevColumns,
            [addedTask.status]: {
              ...prevColumns[addedTask.status],
              items: [...prevColumns[addedTask.status].items, addedTask],
            },
          }));
          closeModal();
        } else {
          throw new Error(response.data.message || "Failed to add task");
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const updateTask = async (taskId, updatedTask) => {
    try {
      const response = await axios.put(
        `${API_URL}/tasks/${taskId}`,
        updatedTask
      );
      if (response.data.success) {
        setColumns((prevColumns) => {
          const newColumns = { ...prevColumns };
          Object.keys(newColumns).forEach((status) => {
            newColumns[status].items = newColumns[status].items.map((task) =>
              task.id === taskId ? { ...task, ...updatedTask } : task
            );
          });
          return newColumns;
        });
        closeEditModal();
      } else {
        throw new Error(response.data.message || "Failed to update task");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await axios.delete(`${API_URL}/tasks/${taskId}`);
      if (response.data.success) {
        setColumns((prevColumns) => {
          const newColumns = { ...prevColumns };
          Object.keys(newColumns).forEach((status) => {
            newColumns[status].items = newColumns[status].items.filter(
              (task) => task.id !== taskId
            );
          });
          return newColumns;
        });
      } else {
        throw new Error(response.data.message || "Failed to delete task");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);

      const updatedTask = { ...removed, status: destination.droppableId };
      await updateTask(removed.id, updatedTask);

      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems,
        },
      });
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems,
        },
      });
    }
  };

  const openModal = (status) => {
    setNewTask({ ...newTask, status });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTask({ title: "", description: "", deadline: "", status: "" });
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleInputChange = (e, taskState, setTaskState) => {
    const { name, value } = e.target;
    setTaskState((prevState) => ({ ...prevState, [name]: value }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="container mx-auto p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(columns).map(([columnId, column]) => (
            <StrictModeDroppable droppableId={columnId} key={columnId}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-gray-100 p-4 rounded-lg flex flex-col h-full"
                >
                  <h2 className="font-bold mb-4">{column.name}</h2>
                  <div className="flex-grow">
                    {column.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-2 mb-2 rounded shadow"
                          >
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm">{item.description}</p>
                            <p className="text-xs text-gray-500">Deadline: {item.deadline}</p>
                            <div className="flex justify-end mt-2">
                              <button onClick={() => openEditModal(item)} className="text-blue-500 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                              <button onClick={() => deleteTask(item.id)} className="text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                  <button
                    onClick={() => openModal(columnId)}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
                  >
                    + Add another card
                  </button>
                </div>
              )}
            </StrictModeDroppable>
          ))}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add new task</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2">
                <label>
                  Task Name:
                  <input
                    type="text"
                    name="title"
                    placeholder="Task Name"
                    value={newTask.title}
                    onChange={(e) => handleInputChange(e, newTask, setNewTask)}
                    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 mb-4"
                  />
                </label>
                <label>
                  Deadline:
                  <input
                    type="date"
                    name="deadline"
                    value={newTask.deadline}
                    onChange={(e) => handleInputChange(e, newTask, setNewTask)}
                    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 mb-4"
                  />
                </label>
                <label>
                  Description:
                  <textarea
                    name="description"
                    placeholder="Enter a description"
                    value={newTask.description}
                    onChange={(e) => handleInputChange(e, newTask, setNewTask)}
                    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 mb-4"
                    rows="4"
                  ></textarea>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={addTask}
                  className="w-full px-4 py-2 bg-blue-500 text-white text-base text-center font-medium rounded-md hover:bg-blue-600"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditModalOpen && editingTask && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit task</h3>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2">
                <label>
                  Task Name:
                  <input
                    type="text"
                    name="title"
                    placeholder="Task Name"
                    value={editingTask.title}
                    onChange={(e) => handleInputChange(e, editingTask, setEditingTask)}
                    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 mb-4"
                  />
                </label>
                <label>
                  Deadline:
                  <input
                    type="date"
                    name="deadline"
                    value={editingTask.deadline}
                    onChange={(e) => handleInputChange(e, editingTask, setEditingTask)}
                    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 mb-4"
                  />
                </label>
                <label>
                  Description:
                  <textarea
                    name="description"
                    placeholder="Enter a description"
                    value={editingTask.description}
                    onChange={(e) => handleInputChange(e, editingTask, setEditingTask)}
                    className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 mb-4"
                    rows="4"
                  ></textarea>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => updateTask(editingTask.id, editingTask)}
                  className="w-full px-4 py-2 bg-blue-500 text-white text-base text-center font-medium rounded-md hover:bg-blue-600"
                >
                  Update Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};
