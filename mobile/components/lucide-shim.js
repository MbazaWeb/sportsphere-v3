const React = require("react");
const { View } = require("react-native");
function Icon(props) {
  const size = (props && props.size) || 20;
  const color = (props && props.color) || "#F5C518";
  return React.createElement(View, {
    style: [
      { width: size, height: size, borderRadius: Math.max(2, size / 4), backgroundColor: color + "33" },
      props && props.style,
    ],
  });
}
module.exports = new Proxy(
  { default: Icon, Icon },
  {
    get(t, prop) {
      if (prop === "__esModule") return true;
      if (prop in t) return t[prop];
      return Icon;
    },
  }
);
