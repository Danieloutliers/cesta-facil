// Offline storage utilities using IndexedDB
const DB_NAME = 'SuperScanDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingProducts';

interface PendingProduct {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
    unit: string;
    timestamp: number;
}

// Open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

// Save product offline
export const saveProductOffline = async (product: Omit<PendingProduct, 'id' | 'timestamp'>): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const pendingProduct: PendingProduct = {
        ...product,
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const request = store.add(pendingProduct);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Get all pending products
export const getPendingProducts = async (): Promise<PendingProduct[]> => {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Delete pending product
export const deletePendingProduct = async (id: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Check if online
export const isOnline = (): boolean => {
    return navigator.onLine;
};

// Sync pending products to server
export const syncPendingProducts = async (
    supabase: any,
    onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> => {
    if (!isOnline()) {
        throw new Error('Offline - cannot sync');
    }

    const pending = await getPendingProducts();
    let success = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
        const product = pending[i];
        onProgress?.(i + 1, pending.length);

        try {
            const { error } = await supabase.from('products').insert([{
                name: product.name,
                price: product.price,
                category: product.category,
                image: product.image,
                unit: product.unit,
            }]);

            if (!error) {
                await deletePendingProduct(product.id);
                success++;
            } else {
                failed++;
            }
        } catch (err) {
            failed++;
        }
    }

    return { success, failed };
};
