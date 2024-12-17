const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { collection, itemSchema, CreditCard } = require('../server');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('User model', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = await mongoServer.getUri();
        console.log("ici")
        console.log(uri);
        //await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it("newUser", async () => {

        var newUser = new collection({
            password: 'qwerty',
            gmail: 'qwerty@gmail.com',
        });

        await newUser.save();

        const savedUser = await collection.findOne({ gmail: 'qwerty@gmail.com' });

        expect(savedUser).not.toBeNull();
        expect(savedUser.password).not.toBe('qwerty');
        expect(savedUser.gmail).toBe('qwerty@gmail.com');
        expect(await bcrypt.compare('qwerty', savedUser.password)).toBe(true);
    });

    it("newItem", async () => {
        var newItem = new itemSchema({
            Name: 'Item',
            Price: 5,
            Stock: 1,
            Description: 'description of an item',
            SellerEmail: 'seller@gmail.com',
            Image: 'item.jpg'
        });

        await newItem.save();

        const savedItem = await itemSchema.findOne({ email: 'seller@gmail.com' });

        expect(savedItem.Name).toBe('Item');
        expect(savedItem.Price).toBe(5);
        expect(savedItem.Stock).toBe(1);
        expect(savedItem.Description).toBe('description of an item');
    });
});