// ============================================
// Complete Page - завершение экскурсии
// ============================================

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Share2, Home, Loader2, PartyPopper } from "lucide-react";
import { sessionsApi } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

export function Complete() {
	const { sessionId } = useParams();
	const navigate = useNavigate();

	const [sessionData, setSessionData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isGeneratingCert, setIsGeneratingCert] = useState(false);
	const [certToken, setCertToken] = useState(null);
	const [showConfetti, setShowConfetti] = useState(false);

	const { visitorName, clearSession } = useSessionStore();
	const confettiRef = useRef(null);

	// Загрузка данных
	useEffect(() => {
		async function loadData() {
			setIsLoading(true);
			try {
				const response = await sessionsApi.getProgress(sessionId);
				setSessionData(response.data);
				setShowConfetti(true);
				setTimeout(() => setShowConfetti(false), 5000);
			} catch (err) {
				console.error("[Complete] Ошибка загрузки:", err);
			} finally {
				setIsLoading(false);
			}
		}
		loadData();
	}, [sessionId]);

	// Получить сертификат
	const handleGetCertificate = async () => {
		setIsGeneratingCert(true);
		try {
			// Завершаем сессию на сервере
			await sessionsApi.complete(sessionId);

			// Загружаем свежие данные сессии (тут есть route_title, enterprise_name)
			const sessionResp = await sessionsApi.getById(sessionId);
			const sessionInfo = sessionResp.data;

			// Загружаем прогресс (тут есть totalScore)
			const progressResp = await sessionsApi.getProgress(sessionId);
			const progressData = progressResp.data;

			const token = sessionInfo.cert_token;
			setCertToken(token);

			const name = visitorName || "Гость";
			const route = sessionInfo?.route_title || "Маршрут";
			const enterprise = sessionInfo?.enterprise_name || "Промышленное предприятие";
			const score = progressData?.totalScore || 0;
			const date = new Date().toLocaleDateString("ru-RU", {
				day: "numeric", month: "long", year: "numeric",
			});

			// Создаём HTML-элемент с кириллицей через браузерный рендер
			const certDiv = document.createElement("div");
			certDiv.innerHTML = `
				<div style="
					width: 792px; height: 612px;
					background: #0D1B2A;
					color: white;
					font-family: 'Montserrat', 'Inter', Arial, sans-serif;
					display: flex; flex-direction: column; align-items: center; justify-content: center;
					position: relative;
					padding: 40px;
					box-sizing: border-box;
				">
					<div style="position:absolute;inset:20px;border:1px solid #00C2D4;border-radius:4px"></div>
					<div style="position:absolute;inset:30px;border:1px solid #00C2D4;border-radius:4px"></div>

					<div style="text-align:center;margin-bottom:10px">
						<div style="font-size:32px;font-weight:bold;color:white;letter-spacing:4px">СЕРТИФИКАТ</div>
						<div style="font-size:14px;color:#00C2D4;margin-top:4px">о прохождении AR-экскурсии</div>
					</div>

					<div style="width:200px;height:1px;background:#00C2D4;margin:12px 0"></div>

					<div style="font-size:16px;color:white;text-align:center;margin-top:8px">Настоящим подтверждается, что</div>
					<div style="font-size:36px;font-weight:bold;color:#00C2D4;margin:12px 0;text-align:center">${name}</div>
					<div style="font-size:16px;color:white;text-align:center">успешно прошёл(ла) экскурсионный маршрут</div>
					<div style="font-size:22px;font-weight:bold;color:white;margin:12px 0;text-align:center">${route}</div>
					<div style="font-size:16px;color:white;text-align:center">на предприятии ${enterprise}</div>

					<div style="margin-top:16px;text-align:center">
						<div style="font-size:14px;color:#999">Набрано баллов</div>
						<div style="font-size:28px;font-weight:bold;color:#00C2D4;margin-top:4px">${score}</div>
					</div>

					<div style="font-size:14px;color:#999;margin-top:16px">Дата: ${date}</div>

					<div style="position:absolute;bottom:40px;right:40px;width:50px;height:50px;border:1px solid #00C2D4;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666">QR</div>
					<div style="position:absolute;bottom:20px;right:40px;font-size:8px;color:#666">ID: ${token?.slice(0, 8) || "XXXX"}</div>

					<div style="position:absolute;bottom:40px;left:40px;font-size:12px;color:#00C2D4">Индустриальный гид</div>
					<div style="position:absolute;bottom:20px;left:40px;font-size:10px;color:#666">arguide.ru</div>
				</div>
			`;

			certDiv.style.position = "fixed";
			certDiv.style.left = "-9999px";
			certDiv.style.top = "0";
			certDiv.style.zIndex = "-1";
			document.body.appendChild(certDiv);

			const html2canvas = (await import("html2canvas")).default;
			const canvas = await html2canvas(certDiv, {
				scale: 2, useCORS: true, backgroundColor: "#0D1B2A",
			});
			document.body.removeChild(certDiv);

			const { default: jsPDF } = await import("jspdf");
			const imgData = canvas.toDataURL("image/jpeg", 0.95);
			const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
			const pdfW = pdf.internal.pageSize.getWidth();
			const pdfH = pdf.internal.pageSize.getHeight();
			pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
			pdf.save(`certificate_${token?.slice(0, 8) || "download"}.pdf`);
		} catch (err) {
			console.error("[Complete] Ошибка генерации сертификата:", err);
		} finally {
			setIsGeneratingCert(false);
		}
	};

	// На главную
	const handleHome = () => {
		clearSession();
		navigate("/");
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-ar-bg flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
					<p className="font-inter text-text-muted">Загрузка...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-ar-bg relative overflow-hidden">
			{showConfetti && (
				<div ref={confettiRef} className="confetti-container">
					{[...Array(50)].map((_, i) => (
						<div key={i} className="confetti"
							style={{
								left: `${Math.random() * 100}%`,
								backgroundColor: ["#00C2D4","#2ECC71","#F39C12","#E74C3C","#9B59B6"][Math.floor(Math.random() * 5)],
								animationDelay: `${Math.random() * 2}s`,
								animationDuration: `${2 + Math.random() * 2}s`,
							}}
						/>
					))}
				</div>
			)}

			<div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
				<div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
					<PartyPopper className="text-success" size={48} />
				</div>

				<h1 className="font-montserrat font-bold text-3xl text-white text-center mb-2">Маршрут пройден!</h1>
				<p className="font-inter text-xl text-primary mb-2">{sessionData?.visitorName || visitorName}</p>

				<div className="text-center mb-8">
					<p className="font-inter text-text-muted">{sessionData?.route_title}</p>
					<p className="font-inter text-sm text-text-muted/60">{sessionData?.enterprise_name}</p>
				</div>

				<div className="text-center mb-10">
					<p className="font-inter text-text-muted mb-2">Суммарный балл</p>
					<p className="font-montserrat font-bold text-7xl text-primary">{sessionData?.totalScore || 0}</p>
				</div>

				<div className="w-full max-w-xs mb-10">
					<div className="flex justify-between text-sm text-text-muted mb-2">
						<span>Посещено точек</span>
						<span>{sessionData?.visitedCount}/{sessionData?.total}</span>
					</div>
					<div className="h-2 bg-white/10 rounded-full overflow-hidden">
						<div className="h-full bg-primary transition-all" style={{ width: `${sessionData?.percent || 0}%` }} />
					</div>
				</div>

				<button onClick={handleGetCertificate} disabled={isGeneratingCert || certToken}
					className="btn-primary w-full max-w-xs flex items-center justify-center gap-2 mb-4"
				>
					{isGeneratingCert ? (
						<><Loader2 className="animate-spin" size={20} />Генерация...</>
					) : certToken ? (
						<><Download size={20} />Сертификат готов!</>
					) : (
						<><Download size={20} />Получить сертификат</>
					)}
				</button>

				<button onClick={handleHome} className="flex items-center gap-2 text-text-muted hover:text-white mt-4">
					<Home size={18} /><span className="font-inter">На главную</span>
				</button>
			</div>
		</div>
	);
}

export default Complete;