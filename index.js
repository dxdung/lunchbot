const lex = require('./LexResponses');
const Lex = new lex();
const db = require('./DB');
const DB = new db();
const uuidv4 = require('uuid/v4');

exports.handler = async (event) => {
    if (event.currentIntent && event.currentIntent.confirmationStatus === "Denied") {
        let message = `are you sure that this is menu URLs?`;
        let intentName = 'SetTheLunchRestaurant';
        let slots = { menuURLs: null };
        return Lex.confirmIntent({ intentName, slots, message })
    }
    return handleSetTheLunchRestaurant(event);
}

const handleSetTheLunchRestaurant = async event => {
    let { slots } = event.currentIntent;
    let { menuURLs } = slots;

    if (!menuURLs) {
        let message = `You need to set the lunch restaurant. Please set it`;
        let intentName = 'SetTheLunchRestaurant';
        slots = { menuURLs };
        return Lex.confirmIntent({ intentName, slots, message });
    }

    let currentDate = new Date;
    let web = currentDate.getDate() - currentDate.getDay() + 9;
    let upcomingWeb = new Date(currentDate.setDate(web));
    let upcomingWebDate = upcomingWeb.getFullYear() + '-' + (upcomingWeb.getMonth() + 1) + '-' + upcomingWeb.getDate();
    let [err, lunchOrder] = await to(DB.get("ID", upcomingWebDate, 'lunch-order'));
    if (!lunchOrder) {
        lunchOrder = { ID: upcomingWebDate, Items: [], name: uuidv4(), TTL: 0 };
    }
    let updatedLunchOrder = { ...lunchOrder, userID: event.userId, Items: [...lunchOrder.Items, menuURLs], TTL: Date.now() + 7 * 24 * 60 * 60 * 1000 };
    let [writeErr, res] = await to(DB.write(upcomingWebDate, updatedLunchOrder, 'lunch-order'));
    if (writeErr) {
        let message = `Unfortunately we've had an error on our system and we can't add this to our lunch order.`;
        return Lex.close({ message });
    }
    let message = `Thank you. the lunch restaurant set. :)`;
    return Lex.elicitIntent({ message });

}


const to = prom => prom.then(data => [null, data]).catch(err => [err, null]);