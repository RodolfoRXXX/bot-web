function jsonToStructProto(json) {
  const fields = {};
  for (const k in json) {
    fields[k] = jsonValueToStruct(json[k]);
  }
  return { fields };
}

function jsonValueToStruct(value) {
  const kind = {};
  if (value === null) {
    kind.nullValue = "NULL_VALUE";
  } else if (typeof value === "number") {
    kind.numberValue = value;
  } else if (typeof value === "string") {
    kind.stringValue = value;
  } else if (typeof value === "boolean") {
    kind.boolValue = value;
  } else if (Array.isArray(value)) {
    kind.listValue = { values: value.map(jsonValueToStruct) };
  } else if (typeof value === "object") {
    kind.structValue = jsonToStructProto(value);
  }
  return kind;
}

module.exports = { jsonToStructProto };
