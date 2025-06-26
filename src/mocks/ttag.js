export function t(strings, ...values) {
  return strings.reduce(
    (result, str, i) => result + str + (values[i] || ""),
    "",
  );
}
