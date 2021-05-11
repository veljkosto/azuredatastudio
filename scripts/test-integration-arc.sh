#!/bin/bash
set -e

if [[ "$OSTYPE" == "darwin"* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT=$(dirname $(dirname $(realpath "$0")))
else
	ROOT=$(dirname $(dirname $(readlink -f $0)))
	# Electron 6 introduces a chrome-sandbox that requires root to run. This can fail. Disable sandbox via --no-sandbox.
	LINUX_EXTRA_ARGS="--no-sandbox"
fi

VSCODEUSERDATADIR=`mktemp -d 2>/dev/null`
VSCODECRASHDIR=$ROOT/.build/crashes
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
	echo "Running integration tests out of sources."
else
	# Configuration for more verbose output
	export VSCODE_CLI=1
	export ELECTRON_ENABLE_STACK_DUMPING=1
	export ELECTRON_ENABLE_LOGGING=1

	# Production builds are run on docker containers where size of /dev/shm partition < 64MB which causes OOM failure
	# for chromium compositor that uses the partition for shared memory
	if [ "$LINUX_EXTRA_ARGS" ]
	then
		LINUX_EXTRA_ARGS="$LINUX_EXTRA_ARGS  --disable-dev-shm-usage --use-gl=swiftshader"
	fi

	echo "Storing crash reports into '$VSCODECRASHDIR'."
	echo "Running integration tests with '$INTEGRATION_TEST_ELECTRON_PATH' as build."
fi

if [ -z "$INTEGRATION_TEST_APP_NAME" ]; then
	after_suite() { true; }
else
	after_suite() { killall $INTEGRATION_TEST_APP_NAME || true; }
fi

ALL_PLATFORMS_API_TESTS_EXTRA_ARGS="--disable-telemetry --crash-reporter-directory=$VSCODECRASHDIR --no-cached-data --disable-updates --disable-keytar --disable-extensions --user-data-dir=$VSCODEUSERDATADIR"

echo **************************
echo *** starting arc tests ***
echo **************************
"$INTEGRATION_TEST_ELECTRON_PATH" $LINUX_EXTRA_ARGS --extensionDevelopmentPath=$ROOT/extensions/arc --extensionTestsPath=$ROOT/extensions/arc/out/integrationTests $ALL_PLATFORMS_API_TESTS_EXTRA_ARGS
after_suite

if [[ "$NO_CLEANUP" == "" ]]; then
	rm -r $VSCODEUSERDATADIR
	rm -r $VSCODEEXTDIR
fi
