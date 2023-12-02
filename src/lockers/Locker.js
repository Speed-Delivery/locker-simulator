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

  useEffect(() => {
    fetchLockers();
  }, []);

  const fetchLockers = async () => {
    const response = await fetch("http://localhost:5005/api/lockers");
    const data = await response.json();
    if (data && Array.isArray(data.lockers)) {
      setLockers(data.lockers);
    } else {
      console.error("Data is not in the expected format:", data);
    }
  };

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
    setUnlockedCabinet(null); // Reset unlocked cabinet when changing location
  };

  const handleCodeChange = (event) => {
    setInputCode(event.target.value);
  };

  const handleUnlock = async () => {
    let foundCabinet = null;
    let foundLockerId = null;

    lockers.forEach((locker) => {
      if (locker.location === selectedLocation) {
        locker.cabinets.forEach((cabinet) => {
          if (cabinet.code === inputCode) {
            foundCabinet = cabinet;
            foundLockerId = locker.id; // Assuming each locker has an 'id' property
            const newStatus =
              cabinet.status === "occupied" ? "available" : "occupied";
            updateCabinetStatus(cabinet, newStatus, foundLockerId);
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

  const updateCabinetStatus = async (cabinet, newStatus, lockerId) => {
    const updateData = {
      cabinetNumber: cabinet.cabinetNumber,
      status: newStatus,
      currentParcel:
        newStatus === "occupied" ? "5f50c31f1234567890abcdef" : null,
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
      }
    } catch (error) {
      console.error("Error updating locker status", error);
    }
  };

  return (
    <div className="text-center">
      {/* Location Selector */}
      {/* Code Input and Unlock Button */}
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
