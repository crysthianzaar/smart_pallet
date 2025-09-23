import { adminDb } from '../../../lib/firebase-admin';
import { IBaseRepository } from '../../repo/interfaces';

export abstract class BaseFirebaseRepository<T, TCreate> implements IBaseRepository<T, TCreate> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async create(data: TCreate): Promise<T> {
    const docData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection(this.collectionName).add(docData);
    const newDoc = await docRef.get();
    
    return {
      id: docRef.id,
      ...newDoc.data(),
    } as T;
  }

  async findById(id: string): Promise<T | null> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    
    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as T;
  }

  async delete(id: string): Promise<void> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    await docRef.delete();
  }

  async findMany(limitCount: number = 50, startAfterId?: string): Promise<T[]> {
    let query = adminDb.collection(this.collectionName)
      .orderBy('createdAt', 'desc')
      .limit(limitCount);
    
    if (startAfterId) {
      const startAfterDoc = await adminDb.collection(this.collectionName).doc(startAfterId).get();
      query = adminDb.collection(this.collectionName)
        .orderBy('createdAt', 'desc')
        .startAfter(startAfterDoc)
        .limit(limitCount);
    }
    
    const querySnapshot = await query.get();
    
    return querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  async list(limitCount: number = 50, startAfterId?: string): Promise<T[]> {
    return this.findMany(limitCount, startAfterId);
  }

  protected async executeQuery(
    field: string,
    operator: any,
    value: any,
    limitCount: number = 50,
    orderByField: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<T[]> {
    const query = adminDb.collection(this.collectionName)
      .where(field, operator, value)
      .orderBy(orderByField, orderDirection)
      .limit(limitCount);
    
    const querySnapshot = await query.get();
    
    return querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  protected async executeComplexQuery(
    filters: Array<{field: string, operator: any, value: any}>,
    limitCount: number = 50,
    orderByField: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc',
    startAfterId?: string
  ): Promise<T[]> {
    let query = adminDb.collection(this.collectionName) as any;
    
    // Apply filters
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
    
    // Apply ordering
    query = query.orderBy(orderByField, orderDirection);
    
    // Apply pagination
    if (startAfterId) {
      const startAfterDoc = await adminDb.collection(this.collectionName).doc(startAfterId).get();
      query = query.startAfter(startAfterDoc);
    }
    
    query = query.limit(limitCount);
    
    const querySnapshot = await query.get();
    
    return querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  protected async findByField(fieldName: string, value: any): Promise<T[]> {
    return this.executeQuery(fieldName, '==', value);
  }

  protected async findOneByField(fieldName: string, value: any): Promise<T | null> {
    const results = await this.findByField(fieldName, value);
    return results.length > 0 ? results[0] : null;
  }
}
