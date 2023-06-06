//
// client_v2.ts
// Copyright (C) 2023 db3.network Author imotai <codego.me@gmail.com>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

import {
    Mutation,
    MutationAction,
    CollectionMutation,
    DocumentMutation,
    DocumentMask,
} from '../proto/db3_mutation_v2'
import type { DocumentData, DocumentEntry } from './base'
import { Index } from '../proto/db3_database'
import { StorageProviderV2 } from '../provider/storage_provider_v2'
import { DB3Account } from '../account/db3_account'
import { fromHEX } from '../crypto/crypto_utils'
import { BSON } from 'db3-bson'
//
//
// the db3 client v2 for developers
//
//
export class DB3ClientV2 {
    readonly storage_provider: StorageProviderV2
    account: DB3Account
    nonce: number
    /**
     * new a db3 client v2 with db3 node url and wallet
     *
     */
    constructor(url: string, account: Account) {
        this.storage_provider = new StorageProviderV2(url, account)
        this.account = account
    }

    async syncNonce() {
        const nonce = await this.storage_provider.getNonce()
        this.nonce = parseInt(nonce)
    }

    /**
     * create a database and return the address of it
     *
     */
    async createSimpleDatabase(desc: string = ''): [string, string] {
        const dm: Mutation = {
            collectionMutations: [],
            documentMutations: [],
            dbAddress: new Uint8Array(),
            action: MutationAction.CreateDocumentDB,
            dbDesc: desc,
        }
        const payload = Mutation.toBinary(dm)
        const response = await this.storage_provider.sendMutation(
            payload,
            this.nonce.toString()
        )
        if (response.code == 0) {
            this.nonce += 1
            return [response.id, response.items[0].value]
        } else {
            throw new Error('fail to create database')
        }
    }

    /**
     * create a collection
     */
    async createCollection(
        databaseAddress: string,
        name: string,
        index: Index[]
    ) {
        const collection: CollectionMutation = {
            index,
            collectionName: name,
        }
        const dm: Mutation = {
            collectionMutations: [collection],
            documentMutations: [],
            dbAddress: fromHEX(databaseAddress),
            action: MutationAction.AddCollection,
            dbDesc: '',
        }
        const payload = Mutation.toBinary(dm)
        const response = await this.storage_provider.sendMutation(
            payload,
            this.nonce.toString()
        )
        if (response.code == 0) {
            this.nonce += 1
            return response.id
        } else {
            throw new Error('fail to create collection')
        }
    }

    /**
     * create a document
     *
     */
    async createDocument(
        databaseAddress: string,
        collectionName: string,
        document: DocumentData
    ) {
        const documentMutation: DocumentMutation = {
            collectionName,
            documents: [BSON.serialize(document)],
            ids: [],
            masks: [],
        }
        const dm: Mutation = {
            action: MutationAction.AddDocument,
            dbAddress: fromHEX(databaseAddress),
            collectionMutations: [],
            documentMutations: [documentMutation],
            dbDesc: '',
        }
        const payload = Mutation.toBinary(dm)
        const response = await this.storage_provider.sendMutation(
            payload,
            this.nonce.toString()
        )
        if (response.code == 0) {
            this.nonce += 1
            return response.id
        } else {
            throw new Error('fail to create collection')
        }
    }

    async deleteDocument(
        databaseAddress: string,
        collectionName: string,
        ids: string[]
    ) {
        const documentMutation: DocumentMutation = {
            collectionName,
            documents: [],
            ids,
            masks: [],
        }
        const dm: Mutation = {
            collectionMutations: [],
            documentMutations: [documentMutation],
            dbAddress: fromHEX(databaseAddress),
            action: MutationAction.DeleteDocument,
            dbDesc: '',
        }
        const payload = Mutation.toBinary(dm)
        const response = await this.storage_provider.sendMutation(
            payload,
            this.nonce.toString()
        )
        if (response.code == 0) {
            this.nonce += 1
            return response.id
        } else {
            throw new Error('fail to create collection')
        }
    }

    //
    //
    // update document with a mask
    //
    //
    async updateDocument(
        databaseAddress: string,
        collectionName: string,
        document: Record<string, any>,
        id: string,
        masks: string[]
    ) {
        const documentMask: DocumentMask = {
            fields: masks,
        }
        const documentMutation: DocumentMutation = {
            collectionName,
            documents: [BSON.serialize(document)],
            ids: [id],
            masks: [documentMask],
        }
        const dm: Mutation = {
            collectionMutations: [],
            documentMutations: [documentMutation],
            dbAddress: fromHEX(databaseAddress),
            action: MutationAction.UpdateDocument,
            dbDesc: '',
        }
        const payload = Mutation.toBinary(dm)
        const response = await this.storage_provider.sendMutation(
            payload,
            this.nonce.toString()
        )
        if (response.code == 0) {
            this.nonce += 1
            return response.id
        } else {
            throw new Error('fail to create collection')
        }
    }
}
