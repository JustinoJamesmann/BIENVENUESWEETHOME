import { Product, Order, User } from "./types";
import { 
  db, 
  auth 
} from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp 
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

const PRODUCTS_COLLECTION = "products";
const ORDERS_COLLECTION = "orders";
const USERS_COLLECTION = "users";

// Default data
export const defaultCategories = ["Electronics", "Accessories", "Clothing", "Food", "Other"];

export const defaultProducts: Product[] = [
  { id: "1", name: "Wireless Earbuds Pro", sku: "WEP-001", category: "Electronics", price: 79.99, quantity: 150 },
  { id: "2", name: "Smart Watch Ultra", sku: "SWU-002", category: "Electronics", price: 299.99, quantity: 45 },
  { id: "3", name: "Mechanical Keyboard", sku: "MKB-003", category: "Electronics", price: 149.99, quantity: 80 },
  { id: "4", name: "USB-C Hub 7-in-1", sku: "UCH-004", category: "Accessories", price: 49.99, quantity: 200 },
  { id: "5", name: "Laptop Stand Aluminum", sku: "LSA-005", category: "Accessories", price: 39.99, quantity: 120 },
  { id: "6", name: "Webcam 4K HDR", sku: "W4K-006", category: "Electronics", price: 119.99, quantity: 8 },
  { id: "7", name: "Desk Mat XXL", sku: "DMX-007", category: "Accessories", price: 29.99, quantity: 300 },
  { id: "8", name: "Portable Charger 20K", sku: "PC2-008", category: "Electronics", price: 59.99, quantity: 5 },
  { id: "9", name: "Bluetooth Speaker Mini", sku: "BSM-009", category: "Electronics", price: 34.99, quantity: 90 },
  { id: "10", name: "Cable Organizer Kit", sku: "COK-010", category: "Accessories", price: 19.99, quantity: 400 },
];

// Helper function to initialize default products
async function initializeDefaultProducts() {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const snapshot = await getDocs(productsRef);
  if (snapshot.empty) {
    for (const product of defaultProducts) {
      await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), product);
    }
  }
}

// Products
export async function loadProducts(): Promise<Product[]> {
  try {
    await initializeDefaultProducts();
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return querySnapshot.docs.map(doc => doc.data() as Product);
  } catch (error) {
    console.error("Error loading products:", error);
    return defaultProducts;
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  for (const product of products) {
    await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), product);
  }
}

export async function addProduct(product: Product): Promise<void> {
  await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), product);
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), product);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}

export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  return onSnapshot(collection(db, PRODUCTS_COLLECTION), (snapshot) => {
    const products = snapshot.docs.map(doc => doc.data() as Product);
    callback(products);
  });
}

// Orders
export async function loadOrders(): Promise<Order[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, ORDERS_COLLECTION), orderBy("date", "desc"))
    );
    return querySnapshot.docs.map(doc => doc.data() as Order);
  } catch (error) {
    console.error("Error loading orders:", error);
    return [];
  }
}

export async function saveOrder(order: Order): Promise<void> {
  await setDoc(doc(db, ORDERS_COLLECTION, order.id), order);
}

export async function updateOrder(id: string, order: Partial<Order>): Promise<void> {
  await updateDoc(doc(db, ORDERS_COLLECTION, id), order);
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, ORDERS_COLLECTION, id));
}

export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  return onSnapshot(
    query(collection(db, ORDERS_COLLECTION), orderBy("date", "desc")),
    (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data() as Order);
      callback(orders);
    }
  );
}

// Categories
export async function loadCategories(): Promise<string[]> {
  return defaultCategories;
}

// Authentication
export async function login(email: string, password: string): Promise<User | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userCredential.user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    
    // Create user document if it doesn't exist
    const newUser: User = {
      id: userCredential.user.uid,
      username: email,
      role: "worker" // Default role
    };
    await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), newUser);
    return newUser;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
      if (userDoc.exists()) {
        callback(userDoc.data() as User);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

export function getCurrentUser(): User | null {
  // This is handled by onAuthChange in React components
  return null;
}
