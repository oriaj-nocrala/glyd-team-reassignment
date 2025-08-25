import { AssignmentResult, Team } from '../types';


export class OutputFormatter {
  /**
   * Format team assignments for console output
   */
  static formatTeamAssignments(result: AssignmentResult): string {
    let output = '';

    output += this.formatHeader(result);
    output += this.formatTeamDetails(result.teams);
    output += this.formatFairnessReport(result);

    return output;
  }

  /**
   * Format assignment header with basic info
   */
  private static formatHeader(result: AssignmentResult): string {
    const { total_players, target_teams, seed } = result;

    let header = '\n';
    header += '╔════════════════════════════════════════════════════════════════════╗\n';
    header += '║                     TEAM REASSIGNMENT RESULTS                     ║\n';
    header += '╚════════════════════════════════════════════════════════════════════╝\n';
    header += `\n📊 Assignment Summary:\n`;
    header += `   • Total Players: ${total_players}\n`;
    header += `   • Target Teams: ${target_teams}\n`;
    header += `   • Seed Used: ${seed}\n`;
    header += `   • Algorithm: Snake Draft with Score Balancing\n\n`;

    return header;
  }

  /**
   * Format detailed team information
   */
  private static formatTeamDetails(teams: Team[]): string {
    let output = '🏆 Team Details:\n\n';

    teams.forEach((team) => {
      output += `┌─ Team ${team.team_id} (${team.size} players) ─────────────────────────────────\n`;
      output += `│ Average Score: ${team.average_score.toFixed(3)} | Total Score: ${team.total_score.toFixed(2)}\n`;
      output += `├─────────────────────────────────────────────────────────────────\n`;

      // Sort players by score (descending) for readability
      const sortedPlayers = [...team.players].sort((a, b) => b.composite_score - a.composite_score);

      sortedPlayers.forEach((player, index) => {
        const prefix = index === sortedPlayers.length - 1 ? '└' : '├';
        const oldTeamInfo =
          player.current_team_name !== '' ? ` (was: ${player.current_team_name})` : '';

        output += `${prefix}─ Player ${player.player_id}: Score ${player.composite_score.toFixed(3)}${oldTeamInfo}\n`;
      });

      output += '\n';
    });

    return output;
  }

  /**
   * Format fairness and balance report
   */
  private static formatFairnessReport(result: AssignmentResult): string {
    const { fairness_stats } = result;

    let report = '⚖️  Balance Analysis:\n\n';

    // Score balance
    report += `📈 Score Distribution:\n`;
    report += `   • Standard Deviation: ${fairness_stats.score_standard_deviation.toFixed(4)}\n`;
    report += `   • Score Range: ${fairness_stats.score_range.min.toFixed(3)} - ${fairness_stats.score_range.max.toFixed(3)}\n`;
    report += `   • Range Span: ${(fairness_stats.score_range.max - fairness_stats.score_range.min).toFixed(3)}\n\n`;

    // Size balance
    report += `👥 Team Size Balance:\n`;
    const { size_balance } = fairness_stats;
    report += `   • Team Sizes: ${size_balance.min_size} - ${size_balance.max_size} players\n`;
    report += `   • Size Difference: ${size_balance.size_difference} (max allowed: 1)\n`;
    report += `   • Size Balance: ${size_balance.size_difference === 0 ? '✅ Perfect' : size_balance.size_difference === 1 ? '✅ Acceptable' : '❌ Poor'}\n\n`;

    // Overall assessment
    const balanceGrade = this.assessBalance(
      fairness_stats.score_standard_deviation,
      size_balance.size_difference
    );
    report += `🎯 Overall Balance Grade: ${balanceGrade}\n\n`;

    // Justification
    report += `💭 Assessment:\n`;
    report += `   ${fairness_stats.justification}\n\n`;

    return report;
  }

  /**
   * Assess overall balance quality with letter grade
   */
  private static assessBalance(scoreStdDev: number, sizeDifference: number): string {
    if (scoreStdDev < 0.05 && sizeDifference === 0) {
      return 'A+ (Excellent)';
    } else if (scoreStdDev < 0.1 && sizeDifference <= 1) {
      return 'A (Very Good)';
    } else if (scoreStdDev < 0.15 && sizeDifference <= 1) {
      return 'B (Good)';
    } else if (scoreStdDev < 0.2 && sizeDifference <= 1) {
      return 'C (Fair)';
    } else {
      return 'D (Poor)';
    }
  }

  /**
   * Format simple assignment list for piping/redirection
   */
  static formatSimpleList(result: AssignmentResult): string {
    let output = '';

    result.teams.forEach((team) => {
      team.players.forEach((player) => {
        output += `${player.player_id},${team.team_id},${player.composite_score.toFixed(4)}\n`;
      });
    });

    return output;
  }

  /**
   * Format as CSV for external processing
   */
  static formatCSV(result: AssignmentResult): string {
    let csv = 'player_id,new_team_id,composite_score,old_team_id,old_team_name\n';

    result.teams.forEach((team) => {
      team.players.forEach((player) => {
        csv += `${player.player_id},${team.team_id},${player.composite_score.toFixed(4)},${player.current_team_id},"${player.current_team_name}"\n`;
      });
    });

    return csv;
  }

  /**
   * Format team summary table
   */
  static formatTeamSummaryTable(teams: Team[]): string {
    let table = '\n📊 Team Summary Table:\n\n';

    // Header
    table += '┌───────┬─────────┬──────────────┬─────────────┬─────────────┐\n';
    table += '│ Team  │ Players │ Avg Score    │ Total Score │ Size Ratio  │\n';
    table += '├───────┼─────────┼──────────────┼─────────────┼─────────────┤\n';

    // Data rows
    const totalPlayers = teams.reduce((sum, team) => sum + team.size, 0);
    teams.forEach((team) => {
      const sizeRatio = ((team.size / totalPlayers) * 100).toFixed(1);
      table += `│   ${team.team_id}   │    ${team.size.toString().padStart(2)}   │    ${team.average_score.toFixed(3)}    │   ${team.total_score.toFixed(2).padStart(7)}   │    ${sizeRatio}%   │\n`;
    });

    table += '└───────┴─────────┴──────────────┴─────────────┴─────────────┘\n\n';

    return table;
  }

  /**
   * Format changes summary (what changed from original teams)
   */
  static formatChangesSummary(result: AssignmentResult): string {
    const moves: { player_id: number; from: string; to: number }[] = [];
    let stayedCount = 0;

    result.teams.forEach((team) => {
      team.players.forEach((player) => {
        if (player.current_team_id !== team.team_id) {
          moves.push({
            player_id: player.player_id,
            from: player.current_team_name || `Team ${player.current_team_id}`,
            to: team.team_id,
          });
        } else {
          stayedCount++;
        }
      });
    });

    let summary = `\n🔄 Assignment Changes:\n\n`;
    summary += `   • Players who stayed: ${stayedCount}\n`;
    summary += `   • Players who moved: ${moves.length}\n`;
    summary += `   • Movement rate: ${((moves.length / result.total_players) * 100).toFixed(1)}%\n\n`;

    if (moves.length > 0) {
      summary += `📋 Player Movements:\n`;
      moves
        .sort((a, b) => a.player_id - b.player_id)
        .forEach((move) => {
          summary += `   • Player ${move.player_id}: ${move.from} → Team ${move.to}\n`;
        });
      summary += '\n';
    }

    return summary;
  }

  /**
   * Format complete output with all sections
   */
  static formatComplete(result: AssignmentResult): string {
    let output = '';

    output += this.formatTeamAssignments(result);
    output += this.formatTeamSummaryTable(result.teams);
    output += this.formatChangesSummary(result);

    // Add footer
    output += '─'.repeat(70) + '\n';
    output += 'Generated by Gyld Team Reassignment Tool\n';
    output += `Timestamp: ${new Date().toISOString()}\n`;

    return output;
  }
}
