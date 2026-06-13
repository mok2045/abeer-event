<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/project-context.php';

$input     = json_decode(file_get_contents('php://input'), true);
$agent_key = $input['agent'] ?? '';
$question  = trim($input['question'] ?? '');   // optional extra question from user

if (empty($agent_key)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing agent key']);
    exit;
}

$api_key = getenv('ANTHROPIC_API_KEY')
    ?: (file_exists(__DIR__ . '/.env') ? (parse_ini_file(__DIR__ . '/.env')['ANTHROPIC_API_KEY'] ?? '') : '');

if (empty($api_key)) {
    http_response_code(500);
    echo json_encode(['error' => 'مفتاح API غير مُعيَّن — أضف ANTHROPIC_API_KEY في ملف .env']);
    exit;
}

// ─────────────────────────────────────────────
// الوكلاء الستة — كل واحد معزول تماماً
// ─────────────────────────────────────────────
$agents = [

    'strategy' => [
        'name'  => 'وكيل الاستراتيجية والأعمال',
        'icon'  => '🏢',
        'color' => '#2563eb',
        'question_focus' => 'أي الصياغات الثلاث أقوى نموذج عمل؟ وهل التسلسل 3→1→2 منطقي؟',
        'system' => 'أنت مستشار استراتيجي رفيع المستوى متخصص في شركات SaaS وأسواق B2B في منطقة الخليج. حكمك مبني على أدلة، ليس تشجيعاً. تحليلك يغطي: نموذج العمل، قابلية التوسع، الميزة التنافسية الدائمة، أي الصياغات الثلاث (سوق / PaaS / SaaS عمودي) أصلح للتنفيذ الآن، ومنطقية التسلسل 3→1→2. كن صريحاً — المؤسس يحتاج حكماً حقيقياً لا مجاملة.',
    ],

    'technical' => [
        'name'  => 'وكيل التقنية والذكاء الاصطناعي',
        'icon'  => '🤖',
        'color' => '#7c3aed',
        'question_focus' => 'هل الكود (10,860 سطر) جاهز للإنتاج؟ وما معمارية API الأنسب؟',
        'system' => 'أنت مهندس أنظمة ذكاء اصطناعي متخصص في وكلاء LLM، بنية واتساب Business API، وأنظمة متعددة المستأجرين (multi-tenant). تحليلك يغطي: تقييم جاهزية الكود (10,860 سطر، 7.5/10 تصميم، 5/10 جاهزية)، معمارية API الأنسب (مفتاح مشترك vs لكل عميل vs BYOK)، المخاطر التقنية، وكيفية مواجهة تهديد Meta Business Agent تقنياً. كن تقنياً ومحدداً.',
    ],

    'marketing' => [
        'name'  => 'وكيل التسويق والمبيعات',
        'icon'  => '📣',
        'color' => '#dc2626',
        'question_focus' => 'كيف تصل لـ 20 عميل مدفوع في 6 أشهر؟ وما قناة الاكتساب الأفضل؟',
        'system' => 'أنت خبير تسويق ومبيعات B2B متخصص في استهداف الشركات الصغيرة في السعودية. تحليلك يغطي: كيفية الوصول لـ 20 عميل مدفوع في 6 أشهر، القنوات الأفضل (الشبكة الشخصية للمؤسس المصرفية/العقارية vs الرقمي)، استراتيجية الدخول للصياغة 3 (محلات الورد)، التسعير (249-399 ريال) مقارنة بالمنافسين، وتأثير تهديد Meta على رسالة التسويق. ركّز على الخطوات القابلة للتنفيذ.',
    ],

    'financial' => [
        'name'  => 'وكيل المالية والاستثمار',
        'icon'  => '💰',
        'color' => '#059669',
        'question_focus' => 'هل الأرقام حقيقية؟ وما التمويل اللازم للوصول لنقطة التعادل؟',
        'system' => 'أنت محلل مالي متخصص في شركات SaaS الناشئة في الخليج. تحليلك يغطي: واقعية الأرقام (الإيراد المتوقع، LTV:CAC 8:1 إلى 31:1، نقطة التعادل 109-230 عميل)، تصحيح الأخطاء الرقمية الموثقة (الإيراد مضخم 2.3x، تكلفة LLM متناقضة 320x)، التمويل اللازم، وأي صياغة تحقق إيراداً أسرع. كن صريحاً في تقييم الأرقام — لا مجاملة.',
    ],

    'risk' => [
        'name'  => 'وكيل المخاطر والتحديات',
        'icon'  => '⚠️',
        'color' => '#d97706',
        'question_focus' => 'ما أشد المخاطر خطورة؟ وكيف تُرتَّب أولوياتها؟',
        'system' => 'أنت محلل مخاطر متخصص في شركات التقنية الناشئة، شهدت فشل مشاريع مشابهة. تحليلك يغطي: تهديد Meta Business Agent (الإطلاق 3 يونيو 2026)، خطر Unifonic/SoftBank على الصياغة 2، مشكلة الدجاجة والبيضة في الصياغة 1، مخاطر التضليل الذاتي (إحصاءات وهمية، كود غير مُختبر)، وترتيب المخاطر من الأشد إلى الأقل خطورة مع حلول مقابل كل منها. كن صريحاً حتى لو كانت المخاطر مؤلمة.',
    ],

    'operations' => [
        'name'  => 'وكيل العمليات والتنفيذ',
        'icon'  => '⚙️',
        'color' => '#0891b2',
        'question_focus' => 'موقع الفريق: مصر أم السعودية؟ وكيف تبدأ التنفيذ الفعلي؟',
        'system' => 'أنت خبير تشغيل وموارد بشرية في شركات تقنية ناشئة بين مصر والسعودية. تحليلك يغطي: قرار موقع الفريق (مصر تقنياً vs السعودية عمليات + مبيعات)، الكفاءات المطلوبة للبدء، خطة التنفيذ الفعلي للوصول لـ 20 عميل مدفوع، التوقيت والأولويات، والعمليات اللازمة للانتقال من الصياغة 3 إلى الصياغات الأكبر. ركّز على القرارات التشغيلية الملموسة.',
    ],
];

if (!isset($agents[$agent_key])) {
    http_response_code(400);
    echo json_encode(['error' => 'Unknown agent: ' . $agent_key]);
    exit;
}

$agent = $agents[$agent_key];

$system_prompt = $agent['system'] . "\n\n"
    . "قدّم تحليلك بالتنسيق التالي:\n"
    . "**📌 تقييمي للوضع الحالي:**\n(٣-٤ نقاط جوهرية)\n\n"
    . "**✅ ما يعمل لصالح المشروع:**\n(نقطتان أو ثلاث)\n\n"
    . "**❌ ما يقلقني:**\n(نقطتان أو ثلاث صريحة)\n\n"
    . "**💡 توصيتي للمؤسس:**\n(خطوة واحدة أو اثنتان قابلتان للتنفيذ هذا الأسبوع)\n\n"
    . "**⚡ حكمي الإجمالي:** (جملة أو جملتان فقط — واضحتان بلا مواربة)";

$user_content = PROJECT_CONTEXT
    . "\n\n---\n\n**تركّز تحليلك على:** " . $agent['question_focus'];

if (!empty($question)) {
    $user_content .= "\n\n**سؤال إضافي من المؤسس:** " . $question;
}

$payload = [
    'model'      => 'claude-haiku-4-5-20251001',
    'max_tokens' => 1200,
    'system'     => $system_prompt,
    'messages'   => [['role' => 'user', 'content' => $user_content]],
];

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . $api_key,
        'anthropic-version: 2023-06-01',
    ],
    CURLOPT_TIMEOUT => 60,
]);

$response  = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200) {
    $err = json_decode($response, true);
    http_response_code(500);
    echo json_encode(['error' => $err['error']['message'] ?? 'API error ' . $http_code]);
    exit;
}

$data = json_decode($response, true);
$text = $data['content'][0]['text'] ?? '';

echo json_encode([
    'agent' => [
        'key'            => $agent_key,
        'name'           => $agent['name'],
        'icon'           => $agent['icon'],
        'color'          => $agent['color'],
        'question_focus' => $agent['question_focus'],
    ],
    'analysis' => $text,
]);
