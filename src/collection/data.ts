import {State} from '../state';
import {Collection, DefaultDataItem} from './index';

export default class Data<DataType = DefaultDataItem> extends State<DataType> {

    private collection: () => Collection;

    // public output: DataType | DefaultDataItem;

    constructor(collection: Collection, data: DataType) {
        super(collection.agileInstance(), data);
        this.collection = () => collection;

        // Set type of State to object because a collection item is always an object
        this.type(Object);
    }
}
