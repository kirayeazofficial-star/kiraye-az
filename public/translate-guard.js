/* Browser page translation (Safari / Chrome "Translate") replaces text nodes behind React's back; React then
   throws on removeChild/insertBefore and the page stops responding (buttons do nothing, it "freezes").
   These guards turn that crash into a no-op, as recommended in facebook/react#11538. */
(function () {
  if (typeof Node !== "function" || !Node.prototype) return;
  var remove = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) return child;
    return remove.apply(this, arguments);
  };
  var insert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (node, ref) {
    if (ref && ref.parentNode !== this) return node;
    return insert.apply(this, arguments);
  };
})();
