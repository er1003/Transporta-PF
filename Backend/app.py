from flask import Flask, jsonify
from flask_cors import CORS

from .database import init_db
from .controllers.aluno_controller import bp as aluno_bp
from .controllers.motorista_controller import bp as motorista_bp
from .controllers.veiculo_controller import bp as veiculo_bp
from .controllers.viagem_controller import bp as viagem_bp
from .controllers.escola_controller import bp as escola_bp
from .controllers.monitora_controller import bp as monitora_bp
from .controllers.me_controller import bp as me_bp
from .controllers.servidor_controller import bp as servidor_bp
from .controllers.acesso_controller import bp as acesso_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    init_db()

    app.register_blueprint(aluno_bp)
    app.register_blueprint(motorista_bp)
    app.register_blueprint(veiculo_bp)
    app.register_blueprint(viagem_bp)
    app.register_blueprint(escola_bp)
    app.register_blueprint(monitora_bp)
    app.register_blueprint(me_bp)
    app.register_blueprint(servidor_bp)
    app.register_blueprint(acesso_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status":"ok","service":"TransportaPF Backend"})

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
