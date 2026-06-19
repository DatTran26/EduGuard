using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.Exams;

internal sealed class ParsedQuestionImport
{
    public int TotalRows { get; set; }
    public List<CreateQuestionRequest> Questions { get; } = [];
    public List<QuestionImportErrorDto> Errors { get; } = [];
}

internal static class QuestionImportParser
{
    public static Task<ParsedQuestionImport> ParseAsync(Stream stream, string fileName, CancellationToken ct)
    {
        var extension = Path.GetExtension(Path.GetFileName(fileName));
        return extension.ToLowerInvariant() switch
        {
            ".csv" => QuestionImportCsvParser.ParseAsync(stream, ct),
            ".xlsx" => QuestionImportXlsxParser.ParseAsync(stream, ct),
            ".txt" => QuestionImportTextFileParser.ParseAsync(stream, ct),
            ".docx" => QuestionImportDocxParser.ParseAsync(stream, ct),
            ".pdf" => QuestionImportPdfParser.ParseAsync(stream, ct),
            _ => Task.FromResult(UnsupportedFileResult(extension))
        };
    }

    private static ParsedQuestionImport UnsupportedFileResult(string extension)
    {
        var result = new ParsedQuestionImport();
        QuestionImportErrors.Add(result.Errors, 0, "file", $"Unsupported question import extension '{extension}'.");
        return result;
    }
}

internal sealed record QuestionImportTabularRow(int RowNumber, IReadOnlyList<string> Values);

internal sealed record QuestionImportOption(string Letter, string Content);

internal sealed class QuestionImportTextBlock
{
    public int RowNumber { get; init; }
    public string Content { get; set; } = string.Empty;
    public string? QuestionType { get; set; }
    public string CorrectAnswer { get; set; } = string.Empty;
    public string Score { get; set; } = string.Empty;
    public List<QuestionImportOption> Options { get; } = [];
}

internal static class QuestionImportCsvParser
{
    public static async Task<ParsedQuestionImport> ParseAsync(Stream stream, CancellationToken ct)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
        var rows = new List<QuestionImportTabularRow>();
        var rowNumber = 0;

        while (!reader.EndOfStream)
        {
            ct.ThrowIfCancellationRequested();
            rowNumber++;
            var line = await reader.ReadLineAsync(ct);
            if (line is null)
                break;

            rows.Add(new QuestionImportTabularRow(rowNumber, ParseCsvRecord(line)));
        }

        return QuestionImportTabularParser.ParseRows(rows, "CSV file is empty.");
    }

    private static List<string> ParseCsvRecord(string line)
    {
        var values = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (var index = 0; index < line.Length; index++)
        {
            var ch = line[index];
            if (ch == '"')
            {
                if (inQuotes && index + 1 < line.Length && line[index + 1] == '"')
                {
                    current.Append('"');
                    index++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (ch == ',' && !inQuotes)
            {
                values.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(ch);
            }
        }

        values.Add(current.ToString());
        return values;
    }
}

internal static class QuestionImportXlsxParser
{
    private static readonly XNamespace SpreadsheetNs = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    private static readonly XNamespace RelationshipNs = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    private static readonly XNamespace PackageRelationshipNs = "http://schemas.openxmlformats.org/package/2006/relationships";

    public static Task<ParsedQuestionImport> ParseAsync(Stream stream, CancellationToken ct)
    {
        var result = new ParsedQuestionImport();

        try
        {
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
            var sheetEntry = GetFirstWorksheetEntry(archive);
            if (sheetEntry is null)
            {
                QuestionImportErrors.Add(result.Errors, 1, "file", "XLSX file does not contain a worksheet.");
                return Task.FromResult(result);
            }

            var sharedStrings = ReadSharedStrings(archive);
            var rows = ReadRows(sheetEntry, sharedStrings, ct);
            return Task.FromResult(QuestionImportTabularParser.ParseRows(rows, "XLSX file is empty."));
        }
        catch (Exception ex) when (ex is InvalidDataException or System.Xml.XmlException)
        {
            QuestionImportErrors.Add(result.Errors, 1, "file", "XLSX file is invalid or corrupted.");
            return Task.FromResult(result);
        }
    }

    private static ZipArchiveEntry? GetFirstWorksheetEntry(ZipArchive archive)
    {
        var workbookEntry = archive.GetEntry("xl/workbook.xml");
        var relsEntry = archive.GetEntry("xl/_rels/workbook.xml.rels");

        if (workbookEntry is not null && relsEntry is not null)
        {
            using var workbookStream = workbookEntry.Open();
            using var relsStream = relsEntry.Open();
            var workbook = XDocument.Load(workbookStream);
            var relationships = XDocument.Load(relsStream);

            var firstSheet = workbook.Descendants(SpreadsheetNs + "sheet").FirstOrDefault();
            var relationshipId = firstSheet?.Attribute(RelationshipNs + "id")?.Value;
            var target = relationships
                .Descendants(PackageRelationshipNs + "Relationship")
                .FirstOrDefault(x => string.Equals(x.Attribute("Id")?.Value, relationshipId, StringComparison.Ordinal))
                ?.Attribute("Target")?.Value;

            var resolvedPath = ResolveWorkbookTarget(target);
            if (resolvedPath is not null)
            {
                var entry = archive.GetEntry(resolvedPath);
                if (entry is not null)
                    return entry;
            }
        }

        return archive.Entries
            .Where(x => x.FullName.StartsWith("xl/worksheets/", StringComparison.OrdinalIgnoreCase)
                && x.FullName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase))
            .OrderBy(x => x.FullName, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    private static string? ResolveWorkbookTarget(string? target)
    {
        if (string.IsNullOrWhiteSpace(target))
            return null;

        var normalized = target.Replace('\\', '/').TrimStart('/');
        if (!normalized.StartsWith("xl/", StringComparison.OrdinalIgnoreCase))
            normalized = "xl/" + normalized;

        return normalized;
    }

    private static List<string> ReadSharedStrings(ZipArchive archive)
    {
        var entry = archive.GetEntry("xl/sharedStrings.xml");
        if (entry is null)
            return [];

        using var stream = entry.Open();
        var document = XDocument.Load(stream);
        return document
            .Descendants(SpreadsheetNs + "si")
            .Select(x => string.Concat(x.Descendants(SpreadsheetNs + "t").Select(t => t.Value)))
            .ToList();
    }

    private static List<QuestionImportTabularRow> ReadRows(
        ZipArchiveEntry sheetEntry,
        IReadOnlyList<string> sharedStrings,
        CancellationToken ct)
    {
        using var stream = sheetEntry.Open();
        var document = XDocument.Load(stream);
        var rows = new List<QuestionImportTabularRow>();
        var fallbackRowNumber = 0;

        foreach (var row in document.Descendants(SpreadsheetNs + "row"))
        {
            ct.ThrowIfCancellationRequested();
            fallbackRowNumber++;
            var rowNumber = int.TryParse(row.Attribute("r")?.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedRow)
                ? parsedRow
                : fallbackRowNumber;

            var cells = new SortedDictionary<int, string>();
            var fallbackColumn = 0;
            foreach (var cell in row.Elements(SpreadsheetNs + "c"))
            {
                var columnIndex = GetColumnIndex(cell.Attribute("r")?.Value, fallbackColumn);
                cells[columnIndex] = GetCellValue(cell, sharedStrings);
                fallbackColumn = columnIndex + 1;
            }

            var maxColumn = cells.Count == 0 ? -1 : cells.Keys.Max();
            var values = Enumerable.Range(0, maxColumn + 1)
                .Select(index => cells.TryGetValue(index, out var value) ? value : string.Empty)
                .ToList();

            rows.Add(new QuestionImportTabularRow(rowNumber, values));
        }

        return rows;
    }

    private static int GetColumnIndex(string? cellReference, int fallbackIndex)
    {
        if (string.IsNullOrWhiteSpace(cellReference))
            return fallbackIndex;

        var letters = new string(cellReference.TakeWhile(char.IsLetter).ToArray()).ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(letters))
            return fallbackIndex;

        var index = 0;
        foreach (var letter in letters)
            index = index * 26 + letter - 'A' + 1;

        return index - 1;
    }

    private static string GetCellValue(XElement cell, IReadOnlyList<string> sharedStrings)
    {
        var type = cell.Attribute("t")?.Value;
        if (string.Equals(type, "inlineStr", StringComparison.OrdinalIgnoreCase))
            return string.Concat(cell.Descendants(SpreadsheetNs + "t").Select(x => x.Value));

        var rawValue = cell.Element(SpreadsheetNs + "v")?.Value ?? string.Empty;
        if (string.Equals(type, "s", StringComparison.OrdinalIgnoreCase)
            && int.TryParse(rawValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var sharedIndex)
            && sharedIndex >= 0
            && sharedIndex < sharedStrings.Count)
        {
            return sharedStrings[sharedIndex];
        }

        if (string.Equals(type, "b", StringComparison.OrdinalIgnoreCase))
            return rawValue == "1" ? "TRUE" : "FALSE";

        return rawValue;
    }
}

internal static class QuestionImportTextFileParser
{
    public static async Task<ParsedQuestionImport> ParseAsync(Stream stream, CancellationToken ct)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
        var text = await reader.ReadToEndAsync(ct);
        return QuestionImportStructuredTextParser.Parse(text, "TXT file does not contain question blocks.");
    }
}

internal static class QuestionImportDocxParser
{
    private static readonly XNamespace WordNs = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    public static Task<ParsedQuestionImport> ParseAsync(Stream stream, CancellationToken ct)
    {
        var result = new ParsedQuestionImport();

        try
        {
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
            var documentEntry = archive.GetEntry("word/document.xml");
            if (documentEntry is null)
            {
                QuestionImportErrors.Add(result.Errors, 1, "file", "DOCX file does not contain document text.");
                return Task.FromResult(result);
            }

            using var documentStream = documentEntry.Open();
            var document = XDocument.Load(documentStream);
            var lines = new List<string>();
            foreach (var paragraph in document.Descendants(WordNs + "p"))
            {
                ct.ThrowIfCancellationRequested();
                var text = string.Concat(paragraph.Descendants(WordNs + "t").Select(x => x.Value)).Trim();
                if (!string.IsNullOrWhiteSpace(text))
                    lines.Add(text);
            }

            return Task.FromResult(QuestionImportStructuredTextParser.Parse(
                string.Join(Environment.NewLine, lines),
                "DOCX file does not contain question blocks."));
        }
        catch (Exception ex) when (ex is InvalidDataException or System.Xml.XmlException)
        {
            QuestionImportErrors.Add(result.Errors, 1, "file", "DOCX file is invalid or corrupted.");
            return Task.FromResult(result);
        }
    }
}

internal static class QuestionImportPdfParser
{
    public static async Task<ParsedQuestionImport> ParseAsync(Stream stream, CancellationToken ct)
    {
        using var memory = new MemoryStream();
        await stream.CopyToAsync(memory, ct);
        var text = QuestionImportPdfTextExtractor.ExtractText(memory.ToArray());
        var result = QuestionImportStructuredTextParser.Parse(text, "PDF file does not contain readable text question blocks.");

        if (result.Questions.Count == 0 && result.Errors.Count == 1 && result.Errors[0].FieldName == "file")
        {
            result.Errors[0].ErrorMessage = "PDF import only supports text-based PDFs that follow the question template. Scanned PDFs require OCR and are not supported.";
        }

        return result;
    }
}

internal static class QuestionImportTabularParser
{
    private static readonly string[] RequiredHeaders =
    [
        "question_text",
        "question_type",
        "correct_answer"
    ];

    public static ParsedQuestionImport ParseRows(IReadOnlyList<QuestionImportTabularRow> rows, string emptyFileMessage)
    {
        var result = new ParsedQuestionImport();
        var nonEmptyRows = rows
            .Where(x => x.Values.Any(value => !string.IsNullOrWhiteSpace(value)))
            .ToList();

        if (nonEmptyRows.Count == 0)
        {
            QuestionImportErrors.Add(result.Errors, 1, "file", emptyFileMessage);
            return result;
        }

        var headerRow = nonEmptyRows[0];
        var headers = headerRow.Values.Select(QuestionImportQuestionBuilder.NormalizeToken).ToList();
        var headerIndexes = headers
            .Select((name, index) => new { name, index })
            .Where(x => !string.IsNullOrWhiteSpace(x.name))
            .GroupBy(x => x.name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First().index, StringComparer.OrdinalIgnoreCase);

        foreach (var requiredHeader in RequiredHeaders)
        {
            if (!headerIndexes.ContainsKey(requiredHeader))
                QuestionImportErrors.Add(result.Errors, headerRow.RowNumber, requiredHeader, $"Missing required column '{requiredHeader}'.");
        }

        if (result.Errors.Count > 0)
            return result;

        foreach (var row in nonEmptyRows.Skip(1))
        {
            result.TotalRows++;
            var question = QuestionImportQuestionBuilder.ParseTabularRow(headerIndexes, row.Values, row.RowNumber, result.Errors);
            if (question is not null)
                result.Questions.Add(question);
        }

        if (result.TotalRows == 0)
            QuestionImportErrors.Add(result.Errors, headerRow.RowNumber, "file", "Import file does not contain question rows.");

        return result;
    }
}

internal static class QuestionImportStructuredTextParser
{
    private static readonly Regex QuestionStartRegex = new(
        @"^\s*(?:C\u00e2u|Cau|Question)\s*\d+\s*[:.\-]\s*(?<text>.+?)\s*$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex OptionRegex = new(
        @"^\s*(?<letter>[A-D])([\.\)])\s*(?<text>.+?)\s*$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex CorrectAnswerRegex = new(
        @"^\s*(?:\u0110\u00e1p\s*\u00e1n|Dap\s*an|Answer)\s*[:\uff1a]\s*(?<value>.+?)\s*$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex QuestionTypeRegex = new(
        @"^\s*(?:question_type|type|Lo\u1ea1i\s*c\u00e2u\s*h\u1ecfi|Loai\s*cau\s*hoi)\s*[:\uff1a]\s*(?<value>.+?)\s*$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex ScoreRegex = new(
        @"^\s*(?:score|\u0110i\u1ec3m|Diem)\s*[:\uff1a]\s*(?<value>.+?)\s*$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex IgnoredMetadataRegex = new(
        @"^\s*(?:subject|chapter|lesson|difficulty|explanation|tags|image_url|status|M\u00f4n|Mon|Ch\u01b0\u01a1ng|Chuong|B\u00e0i|Bai|M\u1ee9c\s*\u0111\u1ed9|Muc\s*do|Gi\u1ea3i\s*th\u00edch|Giai\s*thich)\s*[:\uff1a]",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public static ParsedQuestionImport Parse(string text, string noQuestionMessage)
    {
        var result = new ParsedQuestionImport();
        var blocks = ParseBlocks(text);

        foreach (var block in blocks)
        {
            result.TotalRows++;
            var question = QuestionImportQuestionBuilder.ParseTextBlock(block, result.Errors);
            if (question is not null)
                result.Questions.Add(question);
        }

        if (blocks.Count == 0)
            QuestionImportErrors.Add(result.Errors, 1, "file", noQuestionMessage);

        return result;
    }

    private static List<QuestionImportTextBlock> ParseBlocks(string text)
    {
        var blocks = new List<QuestionImportTextBlock>();
        QuestionImportTextBlock? current = null;
        var lines = text.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');

        for (var index = 0; index < lines.Length; index++)
        {
            var lineNumber = index + 1;
            var trimmed = lines[index].Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                continue;

            var questionMatch = QuestionStartRegex.Match(trimmed);
            if (questionMatch.Success)
            {
                if (current is not null)
                    blocks.Add(current);

                current = new QuestionImportTextBlock
                {
                    RowNumber = lineNumber,
                    Content = questionMatch.Groups["text"].Value.Trim()
                };
                continue;
            }

            if (current is null)
                continue;

            var optionMatch = OptionRegex.Match(trimmed);
            if (optionMatch.Success)
            {
                UpsertOption(
                    current.Options,
                    optionMatch.Groups["letter"].Value.ToUpperInvariant(),
                    optionMatch.Groups["text"].Value.Trim());
                continue;
            }

            var correctAnswerMatch = CorrectAnswerRegex.Match(trimmed);
            if (correctAnswerMatch.Success)
            {
                current.CorrectAnswer = correctAnswerMatch.Groups["value"].Value.Trim();
                continue;
            }

            var questionTypeMatch = QuestionTypeRegex.Match(trimmed);
            if (questionTypeMatch.Success)
            {
                current.QuestionType = questionTypeMatch.Groups["value"].Value.Trim();
                continue;
            }

            var scoreMatch = ScoreRegex.Match(trimmed);
            if (scoreMatch.Success)
            {
                current.Score = scoreMatch.Groups["value"].Value.Trim();
                continue;
            }

            if (IgnoredMetadataRegex.IsMatch(trimmed))
                continue;

            if (current.Options.Count == 0 && string.IsNullOrWhiteSpace(current.CorrectAnswer))
            {
                current.Content = string.IsNullOrWhiteSpace(current.Content)
                    ? trimmed
                    : current.Content + Environment.NewLine + trimmed;
            }
            else if (current.Options.Count > 0 && string.IsNullOrWhiteSpace(current.CorrectAnswer))
            {
                var lastIndex = current.Options.Count - 1;
                var last = current.Options[lastIndex];
                current.Options[lastIndex] = last with { Content = last.Content + " " + trimmed };
            }
        }

        if (current is not null)
            blocks.Add(current);

        return blocks;
    }

    private static void UpsertOption(List<QuestionImportOption> options, string letter, string content)
    {
        var existingIndex = options.FindIndex(x => string.Equals(x.Letter, letter, StringComparison.OrdinalIgnoreCase));
        if (existingIndex >= 0)
            options[existingIndex] = new QuestionImportOption(letter, content);
        else
            options.Add(new QuestionImportOption(letter, content));
    }
}

internal static class QuestionImportQuestionBuilder
{
    public static CreateQuestionRequest? ParseTabularRow(
        IReadOnlyDictionary<string, int> headerIndexes,
        IReadOnlyList<string> values,
        int rowNumber,
        List<QuestionImportErrorDto> errors)
    {
        var startErrorCount = errors.Count;
        var questionText = GetField(headerIndexes, values, "question_text").Trim();
        var questionTypeText = GetField(headerIndexes, values, "question_type").Trim();
        var correctAnswer = GetField(headerIndexes, values, "correct_answer").Trim();

        if (string.IsNullOrWhiteSpace(questionText))
            QuestionImportErrors.Add(errors, rowNumber, "question_text", "question_text is required.");

        if (!TryMapQuestionType(questionTypeText, out var questionType, out var questionTypeError))
            QuestionImportErrors.Add(errors, rowNumber, "question_type", questionTypeError ?? "Invalid question_type.");

        if (string.IsNullOrWhiteSpace(correctAnswer))
            QuestionImportErrors.Add(errors, rowNumber, "correct_answer", "correct_answer is required.");

        var score = ParseScore(GetField(headerIndexes, values, "score"), rowNumber, errors);

        if (errors.Count > startErrorCount)
            return null;

        var options = new[]
        {
            new QuestionImportOption("A", GetField(headerIndexes, values, "option_a")),
            new QuestionImportOption("B", GetField(headerIndexes, values, "option_b")),
            new QuestionImportOption("C", GetField(headerIndexes, values, "option_c")),
            new QuestionImportOption("D", GetField(headerIndexes, values, "option_d"))
        }
            .Where(x => !string.IsNullOrWhiteSpace(x.Content))
            .ToList();

        return BuildQuestion(questionText, questionType, correctAnswer, score, options, rowNumber, errors, startErrorCount);
    }

    public static CreateQuestionRequest? ParseTextBlock(
        QuestionImportTextBlock block,
        List<QuestionImportErrorDto> errors)
    {
        var startErrorCount = errors.Count;
        var questionText = block.Content.Trim();
        var correctAnswer = block.CorrectAnswer.Trim();

        if (string.IsNullOrWhiteSpace(questionText))
            QuestionImportErrors.Add(errors, block.RowNumber, "question_text", "Question text is required.");

        if (string.IsNullOrWhiteSpace(correctAnswer))
            QuestionImportErrors.Add(errors, block.RowNumber, "correct_answer", "Answer line is required.");

        var questionType = QuestionType.SingleChoice;
        if (!string.IsNullOrWhiteSpace(block.QuestionType))
        {
            if (!TryMapQuestionType(block.QuestionType, out questionType, out var questionTypeError))
                QuestionImportErrors.Add(errors, block.RowNumber, "question_type", questionTypeError ?? "Invalid question type.");
        }
        else if (LooksLikeTrueFalse(block.Options, correctAnswer))
        {
            questionType = QuestionType.TrueFalse;
        }
        else if (ParseCorrectLetters(correctAnswer).Count > 1)
        {
            questionType = QuestionType.MultipleChoice;
        }

        var score = ParseScore(block.Score, block.RowNumber, errors);

        if (errors.Count > startErrorCount)
            return null;

        return BuildQuestion(questionText, questionType, correctAnswer, score, block.Options, block.RowNumber, errors, startErrorCount);
    }

    public static string NormalizeToken(string value)
    {
        var normalized = value.Trim().Trim('\uFEFF').Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                builder.Append(ch);
        }

        return builder
            .ToString()
            .Normalize(NormalizationForm.FormC)
            .Replace('\u0111', 'd')
            .Replace('\u0110', 'd')
            .Trim()
            .ToLowerInvariant();
    }

    private static CreateQuestionRequest? BuildQuestion(
        string questionText,
        QuestionType questionType,
        string correctAnswer,
        decimal score,
        IReadOnlyList<QuestionImportOption> options,
        int rowNumber,
        List<QuestionImportErrorDto> errors,
        int startErrorCount)
    {
        var answers = questionType switch
        {
            QuestionType.SingleChoice => ParseChoiceAnswers(options, correctAnswer, rowNumber, errors, requireSingleCorrect: true),
            QuestionType.MultipleChoice => ParseChoiceAnswers(options, correctAnswer, rowNumber, errors, requireSingleCorrect: false),
            QuestionType.TrueFalse => ParseTrueFalseAnswers(options, correctAnswer, rowNumber, errors),
            _ => []
        };

        if (errors.Count > startErrorCount)
            return null;

        try
        {
            ExamQuestionValidator.ValidateQuestionInput(questionType, answers);
        }
        catch (InvalidOperationException ex)
        {
            QuestionImportErrors.Add(errors, rowNumber, "question", ex.Message);
            return null;
        }

        return new CreateQuestionRequest
        {
            Content = questionText.Trim(),
            QuestionType = questionType,
            Score = score,
            OrderIndex = rowNumber,
            Answers = answers
        };
    }

    private static bool TryMapQuestionType(string value, out QuestionType questionType, out string? error)
    {
        questionType = QuestionType.SingleChoice;
        error = null;
        var normalized = NormalizeToken(value).Replace('-', '_').Replace(' ', '_');

        switch (normalized)
        {
            case "single_choice":
            case "single":
            case "one_choice":
                questionType = QuestionType.SingleChoice;
                return true;
            case "multiple_choice":
            case "multiple":
                questionType = QuestionType.MultipleChoice;
                return true;
            case "true_false":
            case "truefalse":
                questionType = QuestionType.TrueFalse;
                return true;
            case "short_answer":
            case "essay":
                error = "Only single_choice, multiple_choice, and true_false are supported for exam-question imports.";
                return false;
            default:
                error = "question_type must be single_choice, multiple_choice, or true_false.";
                return false;
        }
    }

    private static decimal ParseScore(string value, int rowNumber, List<QuestionImportErrorDto> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 1;

        if (!decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var score)
            && !decimal.TryParse(value, NumberStyles.Number, CultureInfo.CurrentCulture, out score))
        {
            QuestionImportErrors.Add(errors, rowNumber, "score", "score must be a number.");
            return 1;
        }

        if (score <= 0)
            QuestionImportErrors.Add(errors, rowNumber, "score", "score must be greater than 0.");

        return score;
    }

    private static List<AnswerInputDto> ParseChoiceAnswers(
        IReadOnlyList<QuestionImportOption> options,
        string correctAnswer,
        int rowNumber,
        List<QuestionImportErrorDto> errors,
        bool requireSingleCorrect)
    {
        var normalizedOptions = options
            .Where(x => !string.IsNullOrWhiteSpace(x.Content))
            .Select(x => new QuestionImportOption(x.Letter.ToUpperInvariant(), x.Content.Trim()))
            .Where(x => x.Letter is "A" or "B" or "C" or "D")
            .GroupBy(x => x.Letter, StringComparer.OrdinalIgnoreCase)
            .Select(x => x.First())
            .ToList();
        var correctLetters = ParseCorrectLetters(correctAnswer);
        var availableLetters = normalizedOptions.Select(x => x.Letter).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var letter in correctLetters)
        {
            if (!availableLetters.Contains(letter))
                QuestionImportErrors.Add(errors, rowNumber, "correct_answer", $"correct_answer '{letter}' is not available in option_a to option_d.");
        }

        if (requireSingleCorrect && correctLetters.Count != 1)
            QuestionImportErrors.Add(errors, rowNumber, "correct_answer", "single_choice requires exactly one correct answer.");

        if (!requireSingleCorrect && correctLetters.Count < 2)
            QuestionImportErrors.Add(errors, rowNumber, "correct_answer", "multiple_choice requires at least two correct answers.");

        return normalizedOptions
            .Select((option, index) => new AnswerInputDto
            {
                Content = option.Content,
                IsCorrect = correctLetters.Contains(option.Letter, StringComparer.OrdinalIgnoreCase),
                OrderIndex = index + 1
            })
            .ToList();
    }

    private static List<AnswerInputDto> ParseTrueFalseAnswers(
        IReadOnlyList<QuestionImportOption> options,
        string correctAnswer,
        int rowNumber,
        List<QuestionImportErrorDto> errors)
    {
        var correctValue = ParseBooleanCorrectAnswer(correctAnswer, options);
        if (!correctValue.HasValue)
            QuestionImportErrors.Add(errors, rowNumber, "correct_answer", "true_false correct_answer must be TRUE/FALSE or point to a True/False option.");

        return
        [
            new AnswerInputDto
            {
                Content = "True",
                IsCorrect = correctValue == true,
                OrderIndex = 1
            },
            new AnswerInputDto
            {
                Content = "False",
                IsCorrect = correctValue == false,
                OrderIndex = 2
            }
        ];
    }

    private static bool? ParseBooleanCorrectAnswer(string correctAnswer, IReadOnlyList<QuestionImportOption> options)
    {
        var normalized = NormalizeToken(correctAnswer);
        var direct = ParseBooleanText(normalized);
        if (direct.HasValue)
            return direct;

        var correctLetters = ParseCorrectLetters(correctAnswer);
        if (correctLetters.Count != 1)
            return null;

        var option = options.FirstOrDefault(x => string.Equals(x.Letter, correctLetters[0], StringComparison.OrdinalIgnoreCase));
        return option is null ? null : ParseBooleanText(NormalizeToken(option.Content));
    }

    private static bool? ParseBooleanText(string normalized) => normalized switch
    {
        "true" or "t" or "yes" or "y" or "dung" or "correct" => true,
        "false" or "f" or "no" or "n" or "sai" or "incorrect" => false,
        _ => null
    };

    private static bool LooksLikeTrueFalse(IReadOnlyList<QuestionImportOption> options, string correctAnswer)
    {
        if (ParseBooleanCorrectAnswer(correctAnswer, options).HasValue)
            return true;

        var normalizedOptions = options
            .Where(x => x.Letter is "A" or "B")
            .Select(x => ParseBooleanText(NormalizeToken(x.Content)))
            .ToList();

        return normalizedOptions.Count == 2
            && normalizedOptions.Contains(true)
            && normalizedOptions.Contains(false);
    }

    private static List<string> ParseCorrectLetters(string correctAnswer) => correctAnswer
        .Split([',', ';', '/', '|'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(x => x.ToUpperInvariant())
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();

    private static string GetField(
        IReadOnlyDictionary<string, int> headerIndexes,
        IReadOnlyList<string> values,
        string header)
    {
        return headerIndexes.TryGetValue(header, out var index) && index < values.Count
            ? values[index]
            : string.Empty;
    }
}

internal static class QuestionImportPdfTextExtractor
{
    private static readonly Regex TextOperatorRegex = new(
        @"\((?:\\.|[^\\)])*\)\s*(?:Tj|'|"")|\[(?:.|\n)*?\]\s*TJ",
        RegexOptions.CultureInvariant | RegexOptions.Singleline);

    private static readonly Regex PdfStringRegex = new(
        @"\((?:\\.|[^\\)])*\)",
        RegexOptions.CultureInvariant | RegexOptions.Singleline);

    public static string ExtractText(byte[] bytes)
    {
        var builder = new StringBuilder();
        foreach (var stream in EnumerateStreams(bytes))
        {
            var text = Encoding.Latin1.GetString(stream);
            AppendTextOperators(text, builder);
        }

        if (builder.Length == 0)
            AppendTextOperators(Encoding.Latin1.GetString(bytes), builder);

        return builder.ToString();
    }

    private static IEnumerable<byte[]> EnumerateStreams(byte[] bytes)
    {
        var cursor = 0;
        while (cursor < bytes.Length)
        {
            var streamToken = IndexOf(bytes, "stream"u8.ToArray(), cursor);
            if (streamToken < 0)
                yield break;

            var dataStart = streamToken + "stream".Length;
            if (dataStart < bytes.Length && bytes[dataStart] == '\r')
                dataStart++;
            if (dataStart < bytes.Length && bytes[dataStart] == '\n')
                dataStart++;

            var endToken = IndexOf(bytes, "endstream"u8.ToArray(), dataStart);
            if (endToken < 0)
                yield break;

            var dataEnd = endToken;
            while (dataEnd > dataStart && (bytes[dataEnd - 1] == '\r' || bytes[dataEnd - 1] == '\n'))
                dataEnd--;

            var data = bytes[dataStart..dataEnd];
            yield return HasFlateDecode(bytes, streamToken) ? TryInflate(data) : data;
            cursor = endToken + "endstream".Length;
        }
    }

    private static bool HasFlateDecode(byte[] bytes, int streamToken)
    {
        var searchStart = Math.Max(0, streamToken - 2048);
        var searchLength = streamToken - searchStart;
        var dictionaryText = Encoding.Latin1.GetString(bytes, searchStart, searchLength);
        return dictionaryText.Contains("/FlateDecode", StringComparison.OrdinalIgnoreCase);
    }

    private static byte[] TryInflate(byte[] data)
    {
        try
        {
            using var input = new MemoryStream(data);
            using var zlib = new ZLibStream(input, CompressionMode.Decompress);
            using var output = new MemoryStream();
            zlib.CopyTo(output);
            return output.ToArray();
        }
        catch (InvalidDataException)
        {
            try
            {
                using var input = new MemoryStream(data);
                using var deflate = new DeflateStream(input, CompressionMode.Decompress);
                using var output = new MemoryStream();
                deflate.CopyTo(output);
                return output.ToArray();
            }
            catch (InvalidDataException)
            {
                return data;
            }
        }
    }

    private static void AppendTextOperators(string content, StringBuilder builder)
    {
        foreach (Match match in TextOperatorRegex.Matches(content))
        {
            foreach (Match stringMatch in PdfStringRegex.Matches(match.Value))
            {
                var decoded = DecodePdfString(stringMatch.Value);
                if (!string.IsNullOrWhiteSpace(decoded))
                    builder.AppendLine(decoded.Trim());
            }
        }
    }

    private static string DecodePdfString(string token)
    {
        var content = token.Length >= 2 ? token[1..^1] : token;
        var builder = new StringBuilder(content.Length);

        for (var index = 0; index < content.Length; index++)
        {
            var ch = content[index];
            if (ch != '\\' || index + 1 >= content.Length)
            {
                builder.Append(ch);
                continue;
            }

            var next = content[++index];
            switch (next)
            {
                case 'n':
                    builder.Append('\n');
                    break;
                case 'r':
                    builder.Append('\r');
                    break;
                case 't':
                    builder.Append('\t');
                    break;
                case 'b':
                    builder.Append('\b');
                    break;
                case 'f':
                    builder.Append('\f');
                    break;
                case '(':
                case ')':
                case '\\':
                    builder.Append(next);
                    break;
                default:
                    if (next is >= '0' and <= '7')
                    {
                        var octal = new StringBuilder().Append(next);
                        for (var count = 0; count < 2 && index + 1 < content.Length && content[index + 1] is >= '0' and <= '7'; count++)
                            octal.Append(content[++index]);

                        builder.Append((char)Convert.ToInt32(octal.ToString(), 8));
                    }
                    else
                    {
                        builder.Append(next);
                    }

                    break;
            }
        }

        return builder.ToString();
    }

    private static int IndexOf(byte[] source, byte[] pattern, int startIndex)
    {
        for (var index = startIndex; index <= source.Length - pattern.Length; index++)
        {
            var found = true;
            for (var patternIndex = 0; patternIndex < pattern.Length; patternIndex++)
            {
                if (source[index + patternIndex] != pattern[patternIndex])
                {
                    found = false;
                    break;
                }
            }

            if (found)
                return index;
        }

        return -1;
    }
}

internal static class QuestionImportErrors
{
    public static void Add(
        List<QuestionImportErrorDto> errors,
        int rowNumber,
        string fieldName,
        string message)
    {
        errors.Add(new QuestionImportErrorDto
        {
            RowNumber = rowNumber,
            FieldName = fieldName,
            ErrorMessage = message
        });
    }
}
