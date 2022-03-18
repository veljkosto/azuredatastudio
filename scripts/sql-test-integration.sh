#!/bin/bash
set -e

if [[ "$OSTYPE" == "darwin"* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT=$(dirname $(dirname $(realpath "$0")))
	VSCODEUSERDATADIR=`mktemp -d -t 'myuserdatadir'`
	VSCODEEXTDIR=`mktemp -d -t 'myextdir'`
else
	ROOT=$(dirname $(dirname $(readlink -f $0)))
	VSCODEUSERDATADIR=`mktemp -d 2>/dev/null`
	VSCODEEXTDIR=`mktemp -d 2>/dev/null`
	# {{SQL CARBON EDIT}} Completed disable sandboxing via --no-sandbox since we still see failures on our test runs
	# --disable-setuid-sandbox: setuid sandboxes requires root and is used in containers so we disable this
	# --disable-dev-shm-usage --use-gl=swiftshader: when run on docker containers where size of /dev/shm
	# partition < 64MB which causes OOM failure for chromium compositor that uses the partition for shared memory
	LINUX_EXTRA_ARGS="--no-sandbox --disable-dev-shm-usage --use-gl=swiftshader"
fi

VSCODECRASHDIR=$ROOT/.build/crashes
VSCODELOGSDIR=$ROOT/.build/logs/sql-integration-tests
cd $ROOT

# Default to only running stable tests if test grep isn't set
if [[ "$ADS_TEST_GREP" == "" ]]; then
	echo Running stable tests only
	export ADS_TEST_GREP=@UNSTABLE@
	export ADS_TEST_INVERT_GREP=1
fi

# Figure out which Electron to use for running tests
if [ -z "$INTEGRATION_TEST_ELECTRON_PATH" ]
then
	# Run out of sources: no need to compile as code.sh takes care of it
	INTEGRATION_TEST_ELECTRON_PATH="./scripts/code.sh"

	echo "Storing crash reports into '$VSCODECRASHDIR'."
	echo "Storing log files into '$VSCODELOGSDIR'."
	echo "Running integration tests out of sources."
else
	# Run from a built: need to compile all test extensions
	# because we run extension tests from their source folders
	# and the build bundles extensions into .build webpacked
	# {{SQL CARBON EDIT}} Don't compile unused extensions
	yarn gulp 	compile-extension:integration-tests

	# Configuration for more verbose output
	export VSCODE_CLI=1
	export ELECTRON_ENABLE_STACK_DUMPING=1
	export ELECTRON_ENABLE_LOGGING=1

	echo "Storing crash reports into '$VSCODECRASHDIR'."
	echo "Storing log files into '$VSCODELOGSDIR'."
	echo "Running integration tests with '$INTEGRATION_TEST_ELECTRON_PATH' as build."
fi

if [[ "$SKIP_PYTHON_INSTALL_TEST" == "1" ]]; then
	echo Skipping Python installation tests.
else
	export PYTHON_TEST_PATH=$VSCODEUSERDATADIR/TestPythonInstallation
	echo $PYTHON_TEST_PATH

	"$INTEGRATION_TEST_ELECTRON_PATH" $LINUX_EXTRA_ARGS --nogpu --extensionDevelopmentPath=$ROOT/extensions/notebook --extensionTestsPath=$ROOT/extensions/notebook/out/integrationTest --user-data-dir=$VSCODEUSERDATADIR --extensions-dir=$VSCODEEXTDIR --remote-debugging-port=9222 --disable-telemetry --disable-crash-reporter --disable-updates --skip-getting-started --disable-inspect
fi

"$INTEGRATION_TEST_ELECTRON_PATH" $LINUX_EXTRA_ARGS \
--extensionDevelopmentPath=$ROOT/extensions/integration-tests \
--extensionTestsPath=$ROOT/extensions/integration-tests/out/test \
--user-data-dir=$VSCODEUSERDATADIR --logsPath=$VSCODELOGSDIR --extensions-dir=$VSCODEEXTDIR \
--nogpu --disable-telemetry --disable-crash-reporter --disable-updates --skip-welcome --disable-inspect --disable-workspace-trust --no-cached-data --crash-reporter-directory=$VSCODECRASHDIR

rm -r -f $VSCODEUSERDATADIR
rm -r $VSCODEEXTDIR
