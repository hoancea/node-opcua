import * as should from "should";

import { DataTypeIds } from "node-opcua-constants";
import { standardUnits } from "node-opcua-data-access";
import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { resolveNodeId } from "node-opcua-nodeid";
import * as nodesets from "node-opcua-nodesets";
import { StatusCodes } from "node-opcua-status-code";
import { Variant } from "node-opcua-variant";
import { DataType } from "node-opcua-variant";

import {
    AddressSpace,
    generateAddressSpace,
    SessionContext,
    UAAnalogItem
} from "..";

// tslint:disable-next-line:no-var-requires
const describe = require("node-opcua-leak-detector").describeWithLeakDetector;
describe("AnalogDataItem ValuePrecision issue #410", () => {

    const nodesetFilename = nodesets.standard_nodeset_file;

    let addressSpace: AddressSpace;
    let analogItem: UAAnalogItem;

    before(async () => {
        addressSpace = AddressSpace.create();

        const  namespace = addressSpace.registerNamespace("Private");
        namespace.index.should.eql(1);

        await generateAddressSpace(addressSpace, nodesetFilename);
        const objectsFolder = addressSpace.findNode("ObjectsFolder")!;

        analogItem = namespace.addAnalogDataItem({
            browseName: "TemperatureSensor",
            dataType: "Double",
            definition: "(tempA -25) + tempB",
            engineeringUnits: standardUnits.degree_celsius,
            engineeringUnitsRange: {low: -2000, high: 2000},
            instrumentRange: {low: -100, high: 200},
            organizedBy: objectsFolder,
            value: new Variant({dataType: DataType.Double, value: 10.0}),
            valuePrecision: 0.5,
        });
    });
    after(async () => {
        addressSpace.dispose();
    });

    it("ValuePrecision should have a DataType Double", () => {
        analogItem.valuePrecision!.dataType.should.be.instanceOf(NodeId);
        analogItem.valuePrecision!.dataType.should.eql(resolveNodeId(DataTypeIds.Double));
    });
    it("ValuePrecision should be writable ", async () => {
        analogItem = analogItem!;

        const dataValue = new DataValue({
            value: new Variant({dataType: DataType.Double, value: 0.25})
        });
        const context = SessionContext.defaultContext;
        const statusCode = await analogItem.valuePrecision!.writeValue(context, dataValue, null);
        statusCode.should.eql(StatusCodes.Good);
    });
});
