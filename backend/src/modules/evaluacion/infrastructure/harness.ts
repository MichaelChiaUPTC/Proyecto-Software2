// Arnés Python que se ejecuta dentro del contenedor (se pasa por stdin junto con el payload en base64).
// Nunca se interpola código del estudiante en la línea de comandos ni en el texto del arnés: viaja en el payload.
// Cada resultado se emite como una línea  <nonce><json>  donde el nonce lo genera el servidor para cada envío,
// así que un print del estudiante no puede falsificar un resultado. El stdout del estudiante se captura aparte.
export const HARNESS = String.raw`
import sys, json, base64, ast, contextlib

def _main():
    p = json.loads(base64.b64decode("%%PAYLOAD%%").decode("utf-8"))
    nonce, src, casos = p["nonce"], p["code"], p["tests"]
    real = sys.stdout
    CAP = 20000

    class Cap:
        def __init__(self): self.partes, self.n = [], 0
        def write(self, s):
            self.n += len(s)
            if self.n > CAP: raise RuntimeError("Tu programa imprimió demasiado texto.")
            self.partes.append(s)
            return len(s)
        def flush(self): pass
        def valor(self): return "".join(self.partes)

    def emit(obj):
        real.write("\n" + nonce + json.dumps(obj, ensure_ascii=True) + "\n")
        real.flush()

    def linea(e):
        if isinstance(e, SyntaxError):
            return e.lineno if e.filename == "<estudiante>" else None
        ultima, tb = None, e.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == "<estudiante>": ultima = tb.tb_lineno
            tb = tb.tb_next
        return ultima

    def describir(e):
        msg = e.msg if isinstance(e, SyntaxError) else str(e)
        return {"type": type(e).__name__, "message": str(msg)[:300], "line": linea(e)}

    def norm(s): return "\n".join(l.rstrip() for l in s.strip().splitlines())

    g = {"__name__": "__estudiante__"}
    try:
        codigo = compile(src, "<estudiante>", "exec")
        with contextlib.redirect_stdout(Cap()), contextlib.redirect_stderr(Cap()):
            exec(codigo, g)
    except BaseException as e:
        emit({"fatal": describir(e)})
        return

    for i, caso in enumerate(casos):
        buf, err, val = Cap(), None, None
        try:
            with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(Cap()):
                val = eval(compile(caso["input"], "<caso>", "eval"), g)
        except BaseException as e:
            err = describir(e)
        actual, ok = None, False
        if err is None:
            esperado = caso["expected"].strip()
            try:
                if val is None:
                    actual = norm(buf.valor())
                    ok = actual == norm(esperado) or (actual == "" and esperado == "None")
                else:
                    actual = repr(val)[:2000]
                    ok = actual == esperado
                    if not ok:
                        try: ok = repr(ast.literal_eval(esperado)) == actual
                        except Exception: pass
            except BaseException as e:
                err = describir(e)
        emit({"i": i, "passed": bool(ok), "actual": None if actual is None else actual[:500], "error": err})

_main()
`
