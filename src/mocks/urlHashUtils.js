export const URLHashUtils = {
    MAP_URL_PARAM_NAME: "map",
    getValue: (key, { rawValue = false, url = window.location.hash } = {}) => {
        let regex = new RegExp(`${key}=([^;]*)(;)?`);
        let result = regex.exec(url);

        if (!rawValue && result) {
            return result[1];
        }

        return result;
    },
    setValue: (key, value) => {
        const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : "";
        const params = new URLSearchParams(hash.replace(/&/g, "&"));
        params.set(key, value);
        console.log(params.toString());
        window.location.href = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    },
};
