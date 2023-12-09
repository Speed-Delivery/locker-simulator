import React, { useState, useEffect } from "react";

const LockerList = () => {
  const [lockers, setLockers] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [unlockedCabinet, setUnlockedCabinet] = useState(null);
  const [cities, setCities] = useState([
    "Helsinki",
    "Espoo",
    "Tampere",
    "Vantaa",
    "Oulu",
  ]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("http://localhost:5005/api/transactions");
      const data = await response.json();
      // Check if the response has a 'transactions' property and it's an array
      return data.transactions && Array.isArray(data.transactions)
        ? data.transactions
        : [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  };

  const fetchLockers = async () => {
    const response = await fetch("http://localhost:5005/api/lockers");
    const data = await response.json();
    return data && Array.isArray(data.lockers) ? data.lockers : [];
  };

  useEffect(() => {
    const fetchData = async () => {
      const lockersData = await fetchLockers();
      const transactionsData = await fetchTransactions();

      console.log("Lockers Data:", lockersData);
      console.log("Transactions Data:", transactionsData);

      const matchedLockers = lockersData.map((locker) => ({
        ...locker,
        cabinets: locker.cabinets.map((cabinet) => {
          const transaction = transactionsData.find(
            (t) => String(t.CabinetId) === String(cabinet._id) // Adjust this condition based on your data structure
          );

          if (transaction) {
            console.log(
              `Cabinet ${cabinet.cabinetNumber} matched with Transaction ID: ${transaction._id}`
            );
          } else {
            console.log(
              `No transaction matched for Cabinet ${cabinet.cabinetNumber}`
            );
          }

          return { ...cabinet, transactionId: transaction?._id };
        }),
      }));

      setLockers(matchedLockers);
    };

    fetchData();
  }, []); // No dependencies are needed here as you want this to run only once at component mount.

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
    setUnlockedCabinet(null);
  };

  const handleCodeChange = (event) => {
    setInputCode(event.target.value);
  };

  const handleUnlock = async () => {
    let foundCabinet = null;
    let foundLockerId = null;
    let foundTransactionId = null;

    // Fetch transactions each time a code is entered
    const transactionsData = await fetchTransactions();

    lockers.forEach((locker) => {
      if (locker.location === selectedLocation) {
        locker.cabinets.forEach((cabinet) => {
          if (cabinet.code === inputCode) {
            foundCabinet = cabinet;
            foundLockerId = locker.id;

            // Match the cabinet with a transaction
            const transaction = transactionsData.find(
              (t) => String(t.CabinetId) === String(cabinet._id)
            );

            if (transaction) {
              console.log(
                `Cabinet ${cabinet.cabinetNumber} matched with Transaction ID: ${transaction._id}`
              );
              foundTransactionId = transaction._id;
            } else {
              console.log(
                `No transaction matched for Cabinet ${cabinet.cabinetNumber}`
              );
            }

            const newStatus =
              cabinet.status === "occupied" ? "available" : "occupied";
            updateCabinetStatus(
              cabinet,
              newStatus,
              foundLockerId,
              foundTransactionId
            );
          }
        });
      }
    });

    if (foundCabinet) {
      setUnlockedCabinet(foundCabinet.cabinetNumber);
    } else {
      alert("Incorrect code for all cabinets in this location.");
    }

    setInputCode("");
  };

  const updateCabinetStatus = async (
    cabinet,
    newStatus,
    lockerId,
    transactionId
  ) => {
    const updateData = {
      cabinetNumber: cabinet.cabinetNumber,
      status: newStatus,
    };

    try {
      const response = await fetch(
        `http://localhost:5005/api/lockers/${lockerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update cabinet status");
      } else {
        cabinet.status = newStatus;
        console.log("XXXXXXX:", transactionId);
        if (transactionId) {
          await updateTransactionStatus(transactionId, newStatus);
        }
      }
    } catch (error) {
      console.error("Error updating locker status", error);
    }
  };

  const updateTransactionStatus = async (transactionId, newCabinetStatus) => {
    console.log("Updating transaction status:", transactionId);

    let transactionStatus;

    switch (newCabinetStatus) {
      case "occupied":
        transactionStatus = "awaiting pickup";
        break;
      case "available":
        transactionStatus = "picked up";
        break;
      default:
        console.error("Invalid cabinet status");
        return;
    }

    const updateData = {
      parcelStatus: transactionStatus,
    };

    try {
      const response = await fetch(
        `http://localhost:5005/api/transactions/${transactionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update transaction status");
      }

      const updatedTransaction = await response.json();
      console.log("Transaction updated:", updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  };

  return (
    <div className="text-center">
      {/* Location Selector */}
      <div className="location-selector mb-4">
        <select
          onChange={handleLocationChange}
          value={selectedLocation}
          className="text-center py-2.5 px-0 w-[25%] text-gray-900 bg-transparent border-0 border-b-2 border-gray-900 appearance-none focus:outline-none focus:ring-0 focus:border-gray-200 peer"
        >
          <option value="">Select Location</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Code Input and Unlock Button */}
      <div className="code-input-section mb-4">
        <input
          type="text"
          value={inputCode}
          onChange={handleCodeChange}
          className="code-input p-3 mr-2 border border-gray-400 rounded-md text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter Code"
        />
        <button
          onClick={handleUnlock}
          className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Unlock
        </button>
      </div>

      {/* Locker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {selectedLocation &&
          lockers
            .filter((locker) => locker.location === selectedLocation)
            .flatMap((locker) =>
              locker.cabinets.map((cabinet) => (
                <Locker
                  key={cabinet.cabinetNumber}
                  cabinet={cabinet}
                  isOpen={unlockedCabinet === cabinet.cabinetNumber}
                />
              ))
            )}
      </div>
    </div>
  );
};

const Locker = ({ cabinet, isOpen }) => {
  return (
    <div
      className={`p-4 sm:p-6 md:max-w-sm mx-auto rounded-lg text-center shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl ${
        isOpen ? "bg-green-400" : "bg-gray-400 hover:bg-gray-700"
      }`}
    >
      <p className="text-lg font-semibold mb-4">{`Cabinet ${cabinet.cabinetNumber}`}</p>
    </div>
  );
};

export default LockerList;
