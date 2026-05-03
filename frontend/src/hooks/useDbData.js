import { useState, useEffect, useCallback } from 'react';
import { createApiClient } from '../api/client';

/**
 * Custom hook to manage data for a database panel.
 * Handles loading users, cars, rentals and CRUD operations.
 */
export function useDbData(dbKey) {
  const [api] = useState(() => createApiClient(dbKey));
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, c, r] = await Promise.all([
        api.getUsers(),
        api.getCars(),
        api.getRentals(),
      ]);
      setUsers(u);
      setCars(c);
      setRentals(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { refresh(); }, [refresh]);

  const addUser = async (data) => {
    await api.createUser(data);
    await refresh();
  };

  const addCar = async (data) => {
    await api.createCar(data);
    await refresh();
  };

  const addRental = async (data) => {
    await api.createRental(data);
    await refresh();
  };

  return { users, cars, rentals, loading, error, refresh, addUser, addCar, addRental, api };
}
