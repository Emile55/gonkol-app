import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../config/firebase"; // 
import { useFilterScreenChildren } from "expo-router/build/layouts/withLayoutContext";

interface LivreurPosition {
    latitude: number;
    longitude: number;
}

type LivreurPositionCallback = (position: LivreurPosition) => void;

const subscribeLivreurPosition = (userId: string, callback: LivreurPositionCallback) => {
    const docRef = doc(db, "users", userId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as LivreurPosition;
            callback({
                latitude: data.latitude,
                longitude: data.longitude,
            });
        }
    });
};

export default subscribeLivreurPosition;
