const _taggedFn = (tags, ...values) => {
    return tags
      .map((tag, index) => {
        return `${tag}${values[index] || ""}`;
      })
      .join("");
  };
  
  const html = _taggedFn
  const css = _taggedFn
  
  export { html, css }