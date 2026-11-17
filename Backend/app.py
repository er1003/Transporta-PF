from flask import Flask, jsonify
from flask_cors import CORS

from .database import init_db
from .controllers.aluno_controller import bp as aluno_bp
from .controllers.motorista_controller import bp as motorista_bp
from .controllers.veiculo_controller import bp as veiculo_bp
from .controllers.viagem_controller import bp as viagem_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    init_db()

    app.register_blueprint(aluno_bp)
    app.register_blueprint(motorista_bp)
    app.register_blueprint(veiculo_bp)
    app.register_blueprint(viagem_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status":"ok","service":"TransportaPF Backend"})

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
