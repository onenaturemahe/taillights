import { useState, useEffect } from "react";
import { Animal } from "@/data/animals";

export function useAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/animals");
      if (!response.ok) throw new Error("Failed to fetch animals");
      const data = await response.json();
      setAnimals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  const createAnimal = async (animal: Partial<Animal>) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/animals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(animal),
      });
      if (!response.ok) throw new Error("Failed to create animal");
      const newAnimal = await response.json();
      setAnimals(prev => [newAnimal, ...prev]);
      return newAnimal;
    } catch (err) {
      throw err;
    }
  };

  const updateAnimal = async (id: string, animal: Partial<Animal>) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/animals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(animal),
      });
      if (!response.ok) throw new Error("Failed to update animal");
      const updatedAnimal = await response.json();
      setAnimals(prev => prev.map(a => a.id === id ? updatedAnimal : a));
      return updatedAnimal;
    } catch (err) {
      throw err;
    }
  };

  const deleteAnimal = async (id: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/animals/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error("Failed to delete animal");
      setAnimals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    animals,
    loading,
    error,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    refetch: fetchAnimals,
  };
}
