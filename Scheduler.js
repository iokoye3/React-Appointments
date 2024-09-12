import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import { db } from "./firebaseconfig";
import { collection, doc, addDoc, deleteDoc, updateDoc, getDocs, query, where } from "firebase/firestore";

const Scheduler = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newDate, setNewDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [editAppointments, setEditAppointments] = useState([]);
    const [key, setKey] = useState('');
    const [edit, setEdit] = useState(null);

    useEffect(() => {
        const fetchAppts = async () => {
            if (selectedDate) {
                const q = query(
                    collection(db, "appointments"),
                    where("date", "==", selectedDate.toDateString())
                );
                const snapshot = await getDocs(q);
                setAppointments(snapshot.docs.map(doc => ({id: doc.id, ...doc.data() })));
            }
        };

        fetchAppts();
    }, [selectedDate]);

    useEffect(() => {
        const fetchEditAppts = async () => {
            if (newDate) {
                const q = query(
                    collection(db, "appointments"),
                    where("date", "==", newDate.toDateString())
                );
                const snapshot = await getDocs(q);
                setEditAppointments(snapshot.docs.map(doc => ({id: doc.id, ...doc.data() })));
            }
        };

        fetchEditAppts();
    }, [newDate]);

    const generateAllTimes = () => {
        const times = [];
        for (let hour = 8; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const period = hour >= 12 ? "PM" : "AM";
                const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                const displayMinute = minute === 0 ? "00" : minute;
                times.push(`${displayHour}:${displayMinute} ${period}`);
            }
        }
        return times;
    }

    const isBooked = (time) => {
        if (!selectedDate) 
            return false;
        return appointments.some(appt => appt.time === time && appt.date === selectedDate.toDateString());
    }

    const hasBeenBooked = (time) => {
        if (!newDate) 
            return false;
        return editAppointments.some(appt => appt.time === time && appt.date === newDate.toDateString() && appt.id !== edit?.id);
    }

    const isPast = (time) => {
        if (!selectedDate) 
            return false;

        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();

        if (!isToday) 
            return false;

        const [timeString, period] = time.split(" ");
        let [hour, minute] = timeString.split(":").map(Number);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        const checkTime = new Date(selectedDate);
        checkTime.setHours(hour, minute);

        return checkTime < today;
    }

    const isPastBooked = (time) => {
        if (!newDate) 
            return false;

        const today = new Date();
        const isToday = newDate.toDateString() === today.toDateString();

        if (!isToday) 
            return false;

        const [timeString, period] = time.split(" ");
        let [hour, minute] = timeString.split(":").map(Number);
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        const checkTime = new Date(newDate);
        checkTime.setHours(hour, minute);

        return checkTime < today;
    }

    const handleSchedule = async (time) => {
        const key = Math.floor(10000 + Math.random() * 90000).toString();
        const formatDate = selectedDate.toDateString();
        await addDoc(collection(db , "appointments"), {
            date: formatDate,
            time,
            shortKey: key
        });
        alert(`Appointment: ${formatDate} at ${time}. Key: ${key}`);
        setSelectedDate(new Date());
    }

    const handleKey = async () => {
        const q = query(collection(db, "appointments"), where("shortKey", "==", key));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const data = snapshot.docs[0];
            setEdit({id: data.id, ...data.data()});
            setNewDate(new Date(data.data().date));
            setKey('');
        } else {
            alert("Invalid key/Appointment not found");
            setEdit(null);
            setKey('');
        }
    }

    const editAppointment = async (newTime) => {
        if (edit) {
            const appt = doc(db, "appointments", edit.id);
            const formatNewDate = newDate.toDateString();
            await updateDoc(appt, {time: newTime, date: formatNewDate});
            alert("Appointment has been updated.");
            setEdit(null);
            setKey('');
        }
    }

    const deleteAppointment = async () => {
        if (edit) {
            const appt = doc(db, "appointments", edit.id);
            await deleteDoc(appt);
            alert("Appointment has been deleted.");
            setEdit(null);
            setKey('');
        }
    }

    return (
        <div className="App">
            <div className="schedule">
                <p>Schedule an appointment: </p>
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    placeholderText="Select a date" 
                />
                {selectedDate && (
                    <div>
                        <p>Available Times:</p>
                        <ul className="timelist">
                            {generateAllTimes().map(time => (
                                <button
                                    key={time}
                                    className="timeoptions"
                                    onClick={() => handleSchedule(time)}
                                    disabled={isBooked(time) || isPast(time)}
                                >
                                    {time}
                                </button>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="editappt">
                <p>Manage existing appointments:</p>
                <input 
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter 5 digit key"
                />
                <button onClick={handleKey} className="edit">Enter</button> 
            </div>

            {edit && (
                <div>
                    <p className="foundappt">Appointment found for {edit.shortKey}: {edit.date} at {edit.time}</p>

                    <p>Edit Appointment Date:</p>
                    <div>
                        <DatePicker 
                            selected={newDate}
                            onChange={(date) => setNewDate(date)}
                            minDate={new Date()}
                        />
                    </div>
                    
                    <p>Available Times:</p>
                    <ul className="timelist">
                        {generateAllTimes().map(time => (
                            <button
                                key={time}
                                className="timeoptions"
                                onClick={() => editAppointment(time)}
                                disabled={hasBeenBooked(time) || isPastBooked(time)}
                            >
                                {time}
                            </button>
                        ))}
                    </ul>
                    <button className="delete" onClick={deleteAppointment}>Delete Appointment</button>
                </div>
            )}
        </div>
    );
}

export default Scheduler;
